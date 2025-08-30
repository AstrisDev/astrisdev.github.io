package data

import (
	"encoding/json"
	mapset "github.com/deckarep/golang-set/v2"
	"github.com/samber/lo"
	"log"
	"sync"
)

type ThumbnailMetadataEntry struct {
	SrcNames    []string `json:"srcNames"`
	SrcChecksum string   `json:"srcChecksum"`
	DstName     string   `json:"dstName"`
}

type ThumbnailsMetadata struct {
	srcName2entry     map[string]*ThumbnailMetadataEntry
	srcChecksum2entry map[string]*ThumbnailMetadataEntry
	mutex             sync.RWMutex
}

func NewThumbnailsMetadata() *ThumbnailsMetadata {
	return &ThumbnailsMetadata{
		srcName2entry:     make(map[string]*ThumbnailMetadataEntry),
		srcChecksum2entry: make(map[string]*ThumbnailMetadataEntry),
	}
}

func (metadata *ThumbnailsMetadata) Add(newEntry *ThumbnailMetadataEntry) {
	metadata.mutex.Lock()
	defer metadata.mutex.Unlock()

	// Find or create entry for the checksum
	entry, ok := metadata.srcChecksum2entry[newEntry.SrcChecksum]
	if !ok {
		entry = &ThumbnailMetadataEntry{
			SrcChecksum: newEntry.SrcChecksum,
			DstName:     newEntry.DstName,
		}
		metadata.srcChecksum2entry[newEntry.SrcChecksum] = entry
	}

	// Update name -> entry mapping
	for _, name := range newEntry.SrcNames {
		metadata.forgetSrcName(name)
		metadata.srcName2entry[name] = entry
		entry.SrcNames = append(entry.SrcNames, name)
	}
}

func (metadata *ThumbnailsMetadata) forgetSrcName(name string) {
	entry, ok := metadata.srcName2entry[name]
	if ok {
		entry.SrcNames = lo.Without(entry.SrcNames, name)
		delete(metadata.srcName2entry, name)
	}
}

func (metadata *ThumbnailsMetadata) FindBySrcChecksum(srcChecksum string) *ThumbnailMetadataEntry {
	metadata.mutex.RLock()
	defer metadata.mutex.RUnlock()
	if entry, ok := metadata.srcChecksum2entry[srcChecksum]; ok {
		return entry
	}
	return nil
}

func (metadata *ThumbnailsMetadata) FindBySrcName(srcName string) *ThumbnailMetadataEntry {
	metadata.mutex.RLock()
	defer metadata.mutex.RUnlock()
	if entry, ok := metadata.srcName2entry[srcName]; ok {
		return entry
	}
	return nil
}

func (metadata *ThumbnailsMetadata) LoadFromBytes(bytes []byte) error {
	metadata.mutex.Lock()
	defer metadata.mutex.Unlock()
	var entries []*ThumbnailMetadataEntry
	err := json.Unmarshal(bytes, &entries)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		metadata.srcChecksum2entry[entry.SrcChecksum] = entry
		for _, name := range entry.SrcNames {
			metadata.srcName2entry[name] = entry
		}
	}
	return nil
}

func (metadata *ThumbnailsMetadata) RemoveOldEntries(usedSrcNames []string, usedSrcChecksums []string) bool {
	metadata.mutex.Lock()
	defer metadata.mutex.Unlock()

	usedSrcNamesSet := mapset.NewSet[string]()
	usedSrcNamesSet.Append(usedSrcNames...)
	usedSrcChecksumsSet := mapset.NewSet[string]()
	usedSrcChecksumsSet.Append(usedSrcChecksums...)

	anythingChanged := false
	for srcName := range metadata.srcName2entry {
		if !usedSrcNamesSet.Contains(srcName) {
			metadata.forgetSrcName(srcName)
			delete(metadata.srcName2entry, srcName)
			anythingChanged = true
		}
	}
	for srcChecksum := range metadata.srcChecksum2entry {
		if !usedSrcChecksumsSet.Contains(srcChecksum) {
			delete(metadata.srcChecksum2entry, srcChecksum)
			anythingChanged = true
		}
	}
	return anythingChanged
}

func (metadata *ThumbnailsMetadata) ToBytes() []byte {
	metadata.mutex.RLock()
	defer metadata.mutex.RUnlock()

	var entries []*ThumbnailMetadataEntry
	for _, entry := range metadata.srcChecksum2entry {
		entries = append(entries, entry)
	}
	bytes, err := json.Marshal(entries)
	if err != nil {
		log.Fatalf("error marshalling metadata: %v", err)
	}
	return bytes
}
