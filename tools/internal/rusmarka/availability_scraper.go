package rusmarka

import (
	"encoding/json"
	"github.com/cheggaaa/pb/v3"
	mapset "github.com/deckarep/golang-set/v2"
	"github.com/gocolly/colly"
	"github.com/samber/lo"
	"os"
	"sf/internal/data"
	"sf/internal/files"
	"strconv"
	"strings"
	"time"
)

type AvailabilityScraper struct {
	destFilePath string
}

type AvailabilityScrapeResult struct {
	AvailableStampIds []int    `json:"availableStampIds"`
	VisitedPages      []string `json:"visitedPages"`
	Timestamp         int64    `json:"timestamp"`
}

type RusmarkaItem struct {
	ids       []int
	price     float64
	available bool
}

func (result *AvailabilityScrapeResult) AreVisitedPagesEqual(pages []string) bool {
	visitedPagesSet := mapset.NewSet[string]()
	visitedPagesSet.Append(result.VisitedPages...)
	pagesSet := mapset.NewSet[string]()
	pagesSet.Append(pages...)
	return visitedPagesSet.Equal(pagesSet)
}

func (result *AvailabilityScrapeResult) ToShopsJsonShop() *data.ShopsJsonShop {
	var items []data.ShopsJsonItem = make([]data.ShopsJsonItem, 0)
	for _, id := range result.AvailableStampIds {
		items = append(items, data.ShopsJsonItem{
			Name: strconv.Itoa(id),
			Ids:  []int{id},
		})
	}
	return &data.ShopsJsonShop{
		Id:          "rusmarka",
		DisplayName: "rusmarka.ru",
		Link:        "https://rusmarka.ru",
		ReportDate:  time.Unix(result.Timestamp, 0).Format("02.01.2006"),
		Items:       items,
	}
}

func NewAvailabilityScraper(destFilePath string) *AvailabilityScraper {
	return &AvailabilityScraper{
		destFilePath: destFilePath,
	}
}

func (scraper *AvailabilityScraper) LastScrapeResult() (*AvailabilityScrapeResult, error) {
	bytes, err := os.ReadFile(scraper.destFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var result AvailabilityScrapeResult
	if err = json.Unmarshal(bytes, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func ExtractRusmarkaItems(body *colly.HTMLElement) []RusmarkaItem {
	var items []RusmarkaItem
	body.ForEach("tr", func(i int, trElement *colly.HTMLElement) {
		var cells []string
		trElement.ForEach("td", func(i int, tdElement *colly.HTMLElement) {
			cells = append(cells, strings.TrimSpace(tdElement.Text))
		})
		if len(cells) == 4 && strings.ToLower(cells[1]) == "чистый" {
			isAvailable := strings.ToLower(cells[3]) == "купить"
			stampIds := parseStampIds(cells[0])
			if stampIds != nil {
				items = append(items, RusmarkaItem{
					stampIds, extractPrice(cells[2]), isAvailable,
				})
			}
		}
	})
	return items
}

func (scraper *AvailabilityScraper) Scrape(urls []string) (*AvailabilityScrapeResult, error) {
	// Remove duplicated urls
	urls = lo.Uniq(urls)

	// Ids of stamps which can be bought, to be populated
	var availableStampIds []int

	// Configure the colly collector
	collector := newAdvancedCollyCollector()
	collector.OnHTML("div.marka-post > table > tbody", func(e *colly.HTMLElement) {
		for _, rusmarkaItem := range ExtractRusmarkaItems(e) {
			if rusmarkaItem.available {
				availableStampIds = append(availableStampIds, rusmarkaItem.ids...)
			}
		}
	})
	progress := pb.New(len(urls))
	progress.SetRefreshRate(30 * time.Second)
	progress.Start()
	for _, pageUrl := range urls {
		err := collector.visitWithRetry(pageUrl)
		if err != nil {
			return nil, err
		}
		progress.Increment()
	}
	progress.Finish()

	result := &AvailabilityScrapeResult{
		AvailableStampIds: lo.Uniq(availableStampIds),
		Timestamp:         time.Now().Unix(),
		VisitedPages:      urls,
	}
	if err := files.SaveAsJsonToFile(result, scraper.destFilePath); err != nil {
		return nil, err
	}
	return result, nil
}
