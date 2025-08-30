package rusmarka

import (
	"errors"
	"github.com/gocolly/colly"
	"log"
	"net/url"
	"regexp"
	"sf/internal/data"
	"strconv"
	"strings"
	"time"
)

var (
	regexpIdRange    = regexp.MustCompile(`^[№\s]*(\d+)-(\d+)`)
	regexpId         = regexp.MustCompile(`^[№\s]*(\d+)`)
	regexPrice       = regexp.MustCompile(`\d+,\d+`)
	regexRectShape   = regexp.MustCompile(`^([,.\d]+)\s*[хx×]\s*([,.\d]+)\s*(мм)?$`)
	regexOvalShape   = regexp.MustCompile(`^овальная, ([,.\d]+)\s*[хx×]\s*([,.\d]+)\s*(мм)?$`)
	regexCircleShape = regexp.MustCompile(`^(?:марка\s*)?круглая, диаметр ([,.\d]+)\s*(мм)?$`)
)

const (
	maxStampsInRange = 40
)

type AdvancedCollyCollector struct {
	*colly.Collector
}

func newAdvancedCollyCollector() *AdvancedCollyCollector {
	collector := colly.NewCollector(colly.AllowURLRevisit())
	return &AdvancedCollyCollector{collector}
}

func (collector *AdvancedCollyCollector) visitWithRetry(pageUrl string) error {
	nRetriesLeft := 2
	for {
		err := collector.Visit(pageUrl)
		if err == nil {
			return nil
		}
		var urlErr *url.Error
		if errors.As(err, &urlErr) {
			if urlErr.Timeout() && nRetriesLeft > 0 {
				log.Printf("Timeout fetching %s, waiting for 30 seconds\n", pageUrl)
				time.Sleep(30 * time.Second)
				nRetriesLeft -= 1
				continue
			}
		}
		return err
	}
}

func makeRangeSlice(min, max int) []int {
	a := make([]int, max-min+1)
	for i := range a {
		a[i] = min + i
	}
	return a
}

func parseStampIds(s string) []int {
	// search for stamp ids only in the first 15 characters of a title
	sr := []rune(s)
	s = string(sr[:min(15, len(sr))])
	if m := regexpIdRange.FindStringSubmatch(s); m != nil {
		start, err1 := strconv.Atoi(m[1])
		end, err2 := strconv.Atoi(m[2])
		if err1 != nil || err2 != nil || start >= end || (end-start+1) >= maxStampsInRange {
			return nil
		}
		return makeRangeSlice(start, end)
	} else if m := regexpId.FindStringSubmatch(s); m != nil {
		id, err := strconv.Atoi(m[1])
		if err != nil {
			return []int{}
		}
		return []int{id}
	} else {
		return []int{}
	}
}

func ParseStampShape(s string) *data.StampShape {
	var shape *data.StampShape
	if m := regexRectShape.FindStringSubmatch(s); m != nil {
		w, err1 := strconv.ParseFloat(strings.ReplaceAll(m[1], ",", "."), 32)
		h, err2 := strconv.ParseFloat(strings.ReplaceAll(m[2], ",", "."), 32)
		if err1 == nil && err2 == nil {
			shape = &data.StampShape{Type: "rect", W: w, H: h}
		}
	} else if m := regexCircleShape.FindStringSubmatch(s); m != nil {
		d, err := strconv.ParseFloat(strings.ReplaceAll(m[1], ",", "."), 32)
		if err == nil {
			shape = &data.StampShape{Type: "circle", D: d}
		}
	} else if m := regexOvalShape.FindStringSubmatch(s); m != nil {
		w, err1 := strconv.ParseFloat(strings.ReplaceAll(m[1], ",", "."), 32)
		h, err2 := strconv.ParseFloat(strings.ReplaceAll(m[2], ",", "."), 32)
		if err1 == nil && err2 == nil {
			shape = &data.StampShape{Type: "oval", W: w, H: h}
		}
	}
	if shape == nil {
		shape = &data.StampShape{Type: "unknown"}
	}
	shape.OriginalText = s
	return shape
}

func extractPrice(s string) float64 {
	priceStr := regexPrice.FindString(s)
	if priceStr != "" {
		priceStr = strings.ReplaceAll(priceStr, ",", ".")
		price, err := strconv.ParseFloat(priceStr, 64)
		if err != nil {
			return 0
		}
		return price
	}
	return 0
}
