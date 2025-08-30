package sf

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"sf/internal/data"
	"sf/internal/files"
	"sf/internal/rusmarka"
	"text/template"
	"time"
)

type Pipeline struct {
	options PipelineOptions

	repoPath        string
	thumbnailsPath  string
	pagesPath       string
	deployCommand   string
	repo            *StampsRepository
	rusmarkaScraper *rusmarka.AvailabilityScraper
}

func NewPipeline(options *PipelineOptions) *Pipeline {
	rootPath := options.RootPath
	repoPath := path.Join(rootPath, "repo")
	return &Pipeline{
		options: *options,

		repoPath:        repoPath,
		thumbnailsPath:  path.Join(rootPath, "thumbnails"),
		pagesPath:       path.Join(rootPath, "pages"),
		rusmarkaScraper: rusmarka.NewAvailabilityScraper(path.Join(rootPath, "rusmarka.json")),
	}
}

func (pipeline *Pipeline) Initialize() error {
	for _, dir := range []string{pipeline.options.RootPath, pipeline.repoPath, pipeline.thumbnailsPath, pipeline.pagesPath} {
		if err := os.Mkdir(dir, 0o755); err != nil && !os.IsExist(err) {
			return err
		}
	}
	pipeline.repo = &StampsRepository{
		Path:       pipeline.repoPath,
		BranchName: pipeline.options.DataSourceBranch,
		RemoteUrl:  pipeline.options.DataSource,
	}
	if pipeline.options.DeployCommand != "" {
		cmdTemplate, err := template.New("deploy").Parse(pipeline.options.DeployCommand)
		if err != nil {
			return fmt.Errorf("error parsing deploy command template: %w", err)
		}
		var commandBuf bytes.Buffer
		err = cmdTemplate.Execute(&commandBuf, struct {
			PagesPath string
		}{
			PagesPath: pipeline.pagesPath,
		})
		if err != nil {
			return fmt.Errorf("error rendering deploy command template: %w", err)
		}
		pipeline.deployCommand = commandBuf.String()
	}
	if pipeline.options.FrontendFiles != "" {
		frontendFilesStat, err := os.Stat(pipeline.options.FrontendFiles)
		if err != nil {
			return fmt.Errorf("failed to stat frontend files directory: %w", err)
		}
		if !frontendFilesStat.IsDir() {
			return fmt.Errorf("%s is not a directory", pipeline.options.FrontendFiles)
		}
	}
	return nil
}

func (pipeline *Pipeline) Update(firstTime bool) error {
	if err := pipeline.repo.EnsureCloned(); err != nil {
		return fmt.Errorf("error ensuring that stamps repository is cloned: %w", err)
	}

	// Fetch stamps repository updates
	log.Println("Checking for stamps repository updates")
	fetchUpdatesErr := pipeline.repo.FetchUpdates()
	if fetchUpdatesErr != nil && fetchUpdatesErr != NoErrAlreadyUpToDate {
		return fmt.Errorf("error fetching updates: %w", fetchUpdatesErr)
	} else if fetchUpdatesErr == nil {
		log.Println("New updates fetched!")
	}

	// Make thumbnails
	makeThumbnailsErr := NoErrAlreadyUpToDate
	if firstTime || fetchUpdatesErr == nil {
		// Update thumbnails only if repository changed
		log.Println("Updating thumbnails")
		makeThumbnailsErr = MakeImageThumbnails(path.Join(pipeline.repoPath, "images"), pipeline.thumbnailsPath)
		if makeThumbnailsErr != nil && makeThumbnailsErr != NoErrAlreadyUpToDate {
			return fmt.Errorf("error making thumbnails: %w", makeThumbnailsErr)
		} else if makeThumbnailsErr == nil {
			log.Println("Thumbnails updated!")
		}
	}

	// Scrape rusmarka
	rusmarkaScraped := false
	lastScrapeResult, err := pipeline.rusmarkaScraper.LastScrapeResult()
	if err != nil {
		return fmt.Errorf("failed loading last rusmarka scrape result: %w", err)
	}
	if !pipeline.options.RusmarkaDisabled {
		stampsJson, err := data.LoadStampsJsonFromFile(path.Join(pipeline.repoPath, "stamps.json"))
		if err != nil {
			return fmt.Errorf("failed loading stamps.json: %w", err)
		}

		needScraping := false
		if lastScrapeResult == nil {
			log.Println("Scraping rusmarka for the first time")
			needScraping = true
		} else if time.Now().Unix()-lastScrapeResult.Timestamp >= int64(pipeline.options.RusmarkaTTL.Seconds()) {
			log.Println("Scraping rusmarka because previous scraping was too long ago")
			needScraping = true
		} else if !lastScrapeResult.AreVisitedPagesEqual(stampsJson.AllPages()) {
			log.Println("Scraping rusmarka due to changed pages in stamps.json")
			needScraping = true
		}

		if needScraping {
			if _, err = pipeline.rusmarkaScraper.Scrape(stampsJson.AllPages()); err != nil {
				return fmt.Errorf("failed scraping rusmarka: %w", err)
			}
			rusmarkaScraped = true
		}
	}

	// Assemble website content
	//   fetchUpdatesErr is nil when something was updated
	//   makeThumbnailsErr is nil when something was updated
	// If nothing changed, NoErrAlreadyUpToDate will be set
	if firstTime || fetchUpdatesErr == nil || makeThumbnailsErr == nil || rusmarkaScraped {
		var reason string
		if firstTime {
			reason = "the first update"
		} else if fetchUpdatesErr == nil {
			reason = "data source update"
		} else if makeThumbnailsErr == nil {
			reason = "thumbnails update"
		} else if rusmarkaScraped {
			reason = "rusmarka scraped"
		}
		log.Printf("Assembling website content [reason: %s]", reason)

		// Delete everything
		err := os.RemoveAll(pipeline.pagesPath)
		if err != nil {
			return err
		}
		// Create pages directory
		err = os.Mkdir(pipeline.pagesPath, 0o755)
		if err != nil {
			return err
		}
		dataPath := path.Join(pipeline.pagesPath, "data")
		err = os.Mkdir(dataPath, 0o755)
		if err != nil {
			return err
		}

		// Copy frontend files
		if pipeline.options.FrontendFiles != "" {
			err = files.CopyDirectoryContents(pipeline.options.FrontendFiles, pipeline.pagesPath)
			if err != nil {
				return fmt.Errorf("error copying frontend files: %w", err)
			}
		}

		// Generate stamps.json
		thumbnails, err := LoadLastThumbnailMetadata(pipeline.thumbnailsPath, true)
		if err != nil {
			return fmt.Errorf("error loading thumbnails metadata: %w", err)
		}
		stampsJson, err := data.LoadStampsJsonFromFile(path.Join(pipeline.repoPath, "stamps.json"))
		if err != nil {
			return fmt.Errorf("error loading stamps.json: %w", err)
		}
		if err = stampsJson.ReplaceImagePathsToThumbnails(thumbnails); err != nil {
			return fmt.Errorf("error replacing image paths to thumbnails: %w", err)
		}
		err = stampsJson.SaveToFile(path.Join(dataPath, "stamps.json"))
		if err != nil {
			return err
		}

		// Generate shops.json
		scrapeResult, err := pipeline.rusmarkaScraper.LastScrapeResult()
		if err != nil {
			return fmt.Errorf("failed to get last rusmarka scrape result: %w", err)
		}
		shopsJson := make([]*data.ShopsJsonShop, 0)
		if scrapeResult != nil {
			shopsJson = append(shopsJson, scrapeResult.ToShopsJsonShop())
		}
		err = files.SaveAsJsonToFile(shopsJson, path.Join(dataPath, "shops.json"))
		if err != nil {
			return fmt.Errorf("failed to write shops.json: %w", err)
		}

		// Copy images
		imagesDirPath := path.Join(dataPath, "images")
		err = os.Mkdir(imagesDirPath, 0o755)
		if err != nil {
			return err
		}
		err = files.CopyDirectoryContents(pipeline.thumbnailsPath, imagesDirPath)
		if err != nil {
			return err
		}
		err = os.Remove(path.Join(imagesDirPath, ThumbnailsMetadataFileName))
		if err != nil {
			return err
		}

		if pipeline.deployCommand != "" {
			// Everything built, deploy now
			log.Println("Running deploy command")
			cmd := exec.Command("sh", "-c", pipeline.deployCommand)
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			err = cmd.Run()
			if err != nil {
				return fmt.Errorf("error running deploy command: %w", err)
			}
		}
	}

	return nil
}

func (pipeline *Pipeline) RunLoop() {
	pipeline.options.PrettyPrint()
	if err := pipeline.Initialize(); err != nil {
		log.Fatal(fmt.Errorf("error while initializing: %w", err))
	}

	log.Println("Doing the first update")
	if err := pipeline.Update(true); err != nil {
		log.Fatal(fmt.Errorf("error doing the first update: %w", err))
	}
	log.Println("The first update completed, subsequent errors will not cause a program crash")
	for {
		log.Printf("Sleeping for %s", pipeline.options.UpdatePeriod)
		time.Sleep(pipeline.options.UpdatePeriod)
		err := pipeline.Update(false)
		if err != nil {
			log.Printf("Error: %s\n", err)
		}
	}
}
