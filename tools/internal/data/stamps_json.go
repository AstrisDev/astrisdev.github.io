package data

import (
	"encoding/json"
	"fmt"
	"github.com/samber/lo"
	"log"
	"os"
	"path"
	"sort"
)

type StampShape struct {
	Type         string  `json:"type,omitempty"`
	W            float64 `json:"w,omitempty"`
	H            float64 `json:"h,omitempty"`
	D            float64 `json:"d,omitempty"`
	OriginalText string  `json:"originalText,omitempty"`
}

type StampEntry struct {
	Id         int         `json:"id"`
	Image      *string     `json:"image"`
	Value      *float64    `json:"value"`
	Year       *int        `json:"year"`
	Page       string      `json:"page"`
	Categories []string    `json:"categories"`
	Series     string      `json:"series,omitempty"`
	Name       string      `json:"name,omitempty"`
	Shape      *StampShape `json:"shape,omitempty"`
}

type StampsJson struct {
	Entries []*StampEntry
}

func (stampsJson *StampsJson) SortEntries() {
	sort.Slice(stampsJson.Entries, func(i, j int) bool {
		idI := stampsJson.Entries[i].Id
		idJ := stampsJson.Entries[j].Id
		return idI < idJ
	})
}

func (stampsJson *StampsJson) AllPages() []string {
	var pages []string
	for _, entry := range stampsJson.Entries {
		pages = append(pages, entry.Page)
	}
	return lo.Uniq(pages)
}

func (stampsJson *StampsJson) ReplaceImagePathsToThumbnails(thumbnails *ThumbnailsMetadata) error {
	for _, entry := range stampsJson.Entries {
		image := entry.Image
		if image != nil {
			imageDir := path.Dir(*image)
			imageName := path.Base(*image)
			thumbnailEntry := thumbnails.FindBySrcName(imageName)
			if thumbnailEntry == nil {
				return fmt.Errorf("no thumbnail found for %s", imageName)
			}
			newImage := path.Join(imageDir, thumbnailEntry.DstName)
			entry.Image = &newImage
		}
	}
	return nil
}

func (stampsJson *StampsJson) ToJson() []byte {
	jsonBytes, err := json.MarshalIndent(stampsJson.Entries, "", "  ")
	if err != nil {
		// Should never happen
		log.Fatal(err)
	}
	return jsonBytes
}

func (stampsJson *StampsJson) SaveToFile(path string) error {
	jsonBytes := stampsJson.ToJson()
	return os.WriteFile(path, jsonBytes, 0644)
}

func LoadStampsJsonFromFile(path string) (*StampsJson, error) {
	// Read file
	fileBytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Unmarshal json
	var stampsJson StampsJson
	err = json.Unmarshal(fileBytes, &(stampsJson.Entries))
	if err != nil {
		return nil, err
	}
	return &stampsJson, nil
}
