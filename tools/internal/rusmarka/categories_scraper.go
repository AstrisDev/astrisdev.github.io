package rusmarka

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sf/internal/data"
	"sort"
	"strconv"
	"strings"

	"github.com/gocolly/colly"
	"github.com/samber/lo"
	"golang.org/x/exp/slices"
)

const (
	maxPagesPerCategory = 30
)

var (
	regexpPageId = regexp.MustCompile(`/(\d+).aspx$`)
)

type category struct {
	id   string
	name string
}

func extractPageId(pageUrl string) string {
	m := regexpPageId.FindStringSubmatch(pageUrl)
	if m != nil {
		return m[1]
	}
	return ""
}

func collectCategoryList() (categories []category, err error) {
	categories = make([]category, 0)
	collector := newAdvancedCollyCollector()
	collector.OnHTML("select[name=category]", func(selectElement *colly.HTMLElement) {
		selectElement.ForEach("option", func(index int, optionElement *colly.HTMLElement) {
			value := optionElement.Attr("value")
			text := strings.TrimSpace(optionElement.Text)
			if value != "" {
				categories = append(categories, category{value, text})
			}
		})
	})
	err = collector.visitWithRetry("https://rusmarka.ru/catalog/marki/year/0.aspx")
	if len(categories) == 0 {
		err = errors.New("no categories found")
	}
	return
}

func CollectMaxPageNumber(catalogUrl string) (int, error) {
	pages := make([]string, 0)

	collector := newAdvancedCollyCollector()
	collector.OnHTML("a[href^='/catalog/marki/year/0/p/']", func(a *colly.HTMLElement) {
		stampsPageUrl := a.Attr("href")
		if stampsPageUrl[0] == '/' {
			stampsPageUrl = "https://rusmarka.ru" + stampsPageUrl
		}
		pages = append(pages, stampsPageUrl)
	})

	err := collector.visitWithRetry(catalogUrl)
	if err != nil {
		return 0, err
	}

	pages = lo.Uniq(pages)

	pageNumbers := lo.Map(pages, func(page string, _ int) int {
		pageNumber := extractPageId(page)
		if pageNumber == "" {
			return 0
		}
		pageNumberInt, err := strconv.Atoi(pageNumber)
		if err != nil {
			return 0
		}
		return pageNumberInt
	})

	return lo.Max(pageNumbers), nil
}

func CollectStampPageUrls(catalogUrl string) ([]string, error) {
	pages := make([]string, 0)
	collector := newAdvancedCollyCollector()
	collector.OnHTML("a[href^='/catalog/marki/position/']", func(a *colly.HTMLElement) {
		stampsPageUrl := a.Attr("href")
		if stampsPageUrl[0] == '/' {
			stampsPageUrl = "https://rusmarka.ru" + stampsPageUrl
		}
		pages = append(pages, stampsPageUrl)
	})
	err := collector.visitWithRetry(catalogUrl)
	if err != nil {
		return nil, err
	}
	pages = lo.Uniq(pages)
	return pages, err
}

func collectStampPageUrlsForCategory(cat category) ([]string, error) {
	pages := make([]string, 0)
	for page := 0; page < maxPagesPerCategory; page++ {
		pageUrl := fmt.Sprintf("https://rusmarka.ru/catalog/marki/year/0/cat/%s/p/%d.aspx", cat.id, page)
		stampPageUrls, err := CollectStampPageUrls(pageUrl)
		if err != nil && err.Error() == http.StatusText(http.StatusNotFound) {
			// 404 is returned after the last page
			break
		} else if err != nil {
			return nil, err
		}
		if len(stampPageUrls) == 0 {
			break
		}
		pages = append(pages, stampPageUrls...)
	}
	return lo.Uniq(pages), nil
}

func ScrapeAndUpdateCategories(stampsJson *data.StampsJson) (int, error) {
	// Collect pages for each category
	categories, err := collectCategoryList()
	if err != nil {
		return 0, err
	}
	pageId2categoryNames := make(map[string][]string)
	for _, cat := range categories {
		log.Printf("Scraping category [%s %s]", cat.id, cat.name)
		pageUrls, err := collectStampPageUrlsForCategory(cat)
		if err != nil {
			return 0, fmt.Errorf("error scraping links with category %s %s: %w", cat.id, cat.name, err)
		}
		for _, pageUrl := range pageUrls {
			pageId := extractPageId(pageUrl)
			if pageId != "" {
				prevCategoryNames := pageId2categoryNames[pageId]
				pageId2categoryNames[pageId] = append(prevCategoryNames, cat.name)
			}
		}
	}
	// Update categories in stamps.json
	nStampsUpdates := 0
	for _, entry := range stampsJson.Entries {
		pageId := extractPageId(entry.Page)
		if pageId != "" {
			newStampCategories := pageId2categoryNames[pageId]
			if newStampCategories == nil {
				newStampCategories = make([]string, 0)
			}
			sort.Strings(newStampCategories)
			sort.Strings(entry.Categories)
			if !slices.Equal(newStampCategories, entry.Categories) {
				entry.Categories = newStampCategories
				nStampsUpdates += 1
			}
		}
	}
	return nStampsUpdates, nil
}
