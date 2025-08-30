package rusmarka

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly"
	"github.com/samber/lo"
	"image"
	_ "image/jpeg"
	"image/png"
	"io"
	"log"
	"net/http"
	"sf/internal/data"
	"strconv"
	"strings"
	"time"
)

type ScrapedStamps struct {
	Entries []*data.StampEntry
	Images  map[string][]byte
}

type scrapedPropertiesRow struct {
	Id         int
	Properties map[string]string
}

type scrapedPagePart struct {
	title           string
	titleWithoutIds string
	ids             []int
	imagePngBytes   []byte
}
type scrapedPage struct {
	title        string
	parts        []scrapedPagePart
	propertyRows []scrapedPropertiesRow
	items        []RusmarkaItem
}

func downloadImage(url string) ([]byte, error) {
	// Make http request
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error downloading %s: http code %d", url, resp.StatusCode)
	}

	// Download response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error downloading image from %s: %w", url, err)
	}

	// Convert image to png
	stampImage, _, err := image.Decode(bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("error decofing image %s: %w", url, err)
	}
	var pngImageBuffer bytes.Buffer
	err = png.Encode(&pngImageBuffer, stampImage)
	if err != nil {
		return nil, fmt.Errorf("error converting image to png: %w", err)
	}
	return pngImageBuffer.Bytes(), nil
}

func scrapePropertiesTable(table *goquery.Selection, idHint *int) []scrapedPropertiesRow {
	var keys []string
	var values [][]string
	table.Find("thead").Find("th").Each(func(_ int, th *goquery.Selection) {
		keys = append(keys, th.Text())
	})
	table.Find("tbody").Find("tr").Each(func(_ int, tr *goquery.Selection) {
		var rowValues []string
		tr.Find("td").Each(func(i int, td *goquery.Selection) {
			rowValues = append(rowValues, td.Text())
		})
		values = append(values, rowValues)
	})
	var rows []scrapedPropertiesRow
	if len(keys) != 0 {
		for _, rowValues := range values {
			var id int
			var err error
			if len(rowValues) != 1 || idHint == nil {
				id, err = strconv.Atoi(rowValues[0])
				if err != nil {
					id = 0
				}
			} else {
				id = *idHint
			}
			key2value := make(map[string]string)
			for j := 0; j < min(len(keys), len(rowValues)); j++ {
				key2value[keys[j]] = rowValues[j]
			}
			rows = append(rows, scrapedPropertiesRow{Id: id, Properties: key2value})
		}
	}
	return rows
}

func scrapePageParts(pageUrl string) (*scrapedPage, error) {
	var pageTitle string
	var items []RusmarkaItem
	var propertyRows []scrapedPropertiesRow
	parts := make([]scrapedPagePart, 0)
	collector := newAdvancedCollyCollector()
	collector.OnHTML("html", func(html *colly.HTMLElement) {
		pageTitle = strings.TrimSpace(html.DOM.Find("title").Text())
		items = ExtractRusmarkaItems(html)
		html.ForEach("div[aria-labelledby=profile-tab]", func(_ int, element *colly.HTMLElement) {
			parsedRows := scrapePropertiesTable(element.DOM.Find("table"), nil)
			propertyRows = append(propertyRows, parsedRows...)
		})
		html.ForEach("h2.marka-post-title", func(index int, h2 *colly.HTMLElement) {
			stampIds := parseStampIds(h2.Text)
			if len(stampIds) != 0 {
				h2text := strings.TrimSpace(h2.Text)
				part := scrapedPagePart{
					title:           h2text,
					titleWithoutIds: h2text,
					ids:             stampIds,
				}
				imgAfterTitle := h2.DOM.Parent().Next().Find("img")
				imageUrl, ok := imgAfterTitle.Attr("data-zoom-image")
				if ok && len(imageUrl) >= 1 {
					if imageUrl[0] == '/' {
						imageUrl = "https://rusmarka.ru" + imageUrl
					}
					imageBytes, err := downloadImage(imageUrl)
					if err != nil {
						log.Printf("error downloaing image %s: %s", imageUrl, err)
					} else {
						part.imagePngBytes = imageBytes
					}
				}

				if len(stampIds) == 1 {
					id := stampIds[0]
					propertiesTableAfterTitle := h2.DOM.Parent().Next().Next().Find("table")
					propertyRows = append(propertyRows, scrapePropertiesTable(propertiesTableAfterTitle, &id)...)
				}

				parts = append(parts, part)
			}
		})
	})
	err := collector.visitWithRetry(pageUrl)
	if err != nil {
		return nil, err
	}
	if pageTitle == "" {
		return nil, errors.New("no title or parts found")
	}
	return &scrapedPage{
		title:        pageTitle,
		parts:        parts,
		propertyRows: propertyRows,
		items:        items,
	}, nil
}

func ScrapeStampsFromNewPage(pageUrl string) (*ScrapedStamps, error) {
	page, err := scrapePageParts(pageUrl)
	if err != nil {
		return nil, err
	}

	var idsOnPage []int
	for _, part := range page.parts {
		idsOnPage = append(idsOnPage, part.ids...)
	}
	for _, row := range page.propertyRows {
		if row.Id != 0 {
			idsOnPage = append(idsOnPage, row.Id)
		}
	}
	for _, item := range page.items {
		idsOnPage = append(idsOnPage, item.ids...)
	}
	idsOnPage = lo.Uniq(idsOnPage)

	var knownStampIds []int
	scrapedStamps := &ScrapedStamps{
		Entries: make([]*data.StampEntry, 0),
		Images:  make(map[string][]byte),
	}
	currentYear := time.Now().Year()

	/* Extract entries from page parts */
	for _, part := range page.parts {
		// Don't add the same stamp id multiple times
		alreadyKnown := false
		for _, id := range part.ids {
			if lo.Contains(knownStampIds, id) {
				alreadyKnown = true
			}
			knownStampIds = append(knownStampIds, id)
		}
		if alreadyKnown {
			continue
		}
		// Generate stamp Entries
		for _, id := range part.ids {
			name := page.title
			if len(idsOnPage) != 1 {
				name = fmt.Sprintf("%s. %s.", page.title, part.title)
			}
			value := 0.0
			for _, item := range page.items {
				if lo.Contains(item.ids, id) {
					value = item.price / float64(len(item.ids))
					break
				}
			}

			var imageFileName string
			if len(part.ids) == 1 {
				imageFileName = fmt.Sprintf("images/%d.png", part.ids[0])
			} else {
				imageFileName = fmt.Sprintf("images/%d-%d.png", part.ids[0], part.ids[len(part.ids)-1])
			}

			entry := &data.StampEntry{
				Id:         id,
				Page:       pageUrl,
				Value:      &value,
				Year:       &currentYear,
				Categories: []string{},
				Name:       name,
			}
			if part.imagePngBytes != nil {
				entry.Image = &imageFileName
				scrapedStamps.Images[imageFileName] = part.imagePngBytes
			}

			scrapedStamps.Entries = append(scrapedStamps.Entries, entry)
		}
	}

	/* Add entries with shop items or property rows */
	for _, id := range idsOnPage {
		_, hasEntry := lo.Find(scrapedStamps.Entries, func(entry *data.StampEntry) bool {
			return entry.Id == id
		})
		if !hasEntry {
			var value float64 = 0
			scrapedStamps.Entries = append(scrapedStamps.Entries, &data.StampEntry{
				Id:         id,
				Page:       pageUrl,
				Value:      &value,
				Year:       &currentYear,
				Categories: []string{},
				Name:       "",
			})
		}
	}

	/* Populate shape */
	extractShapeText := func(row scrapedPropertiesRow) string {
		for _, shapeKey := range []string{"Размер", "Формат марки", "Формат", "Формат марки в блоке",
			"Размер марки в блоке", "Формат марок в блоке", "Формат марок", "Форматы марок"} {
			if v, ok := row.Properties[shapeKey]; ok {
				return v
			}
		}
		return ""
	}
	shapeOriginalTextsWithoutId := lo.Uniq(lo.FilterMap(lo.Filter(page.propertyRows, func(row scrapedPropertiesRow, _ int) bool {
		return row.Id == 0
	}), func(row scrapedPropertiesRow, _ int) (string, bool) {
		t := extractShapeText(row)
		return extractShapeText(row), t != ""
	}))

	for _, entry := range scrapedStamps.Entries {
		specificPropsRow, hasSpecificPropsRow := lo.Find(page.propertyRows, func(row scrapedPropertiesRow) bool {
			return row.Id == entry.Id
		})
		var shapeText string
		if hasSpecificPropsRow {
			shapeText = extractShapeText(specificPropsRow)
		} else if len(shapeOriginalTextsWithoutId) == 1 {
			shapeText = shapeOriginalTextsWithoutId[0]
		}
		if shapeText != "" {
			entry.Shape = ParseStampShape(shapeText)
		}
	}

	return scrapedStamps, err
}
