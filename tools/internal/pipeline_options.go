package sf

import (
	"log"
	"time"
)

type PipelineOptions struct {
	RootPath         string        `short:"r" long:"root" required:"true" description:"directory where any state is stored"`
	RusmarkaDisabled bool          `long:"disable-rusmarka" description:"completely disable scraping rusmarka"`
	RusmarkaTTL      time.Duration `long:"rusmarka-ttl" default:"168h" description:"period between rusmarka scraping runs if stamps data is not updated"`
	UpdatePeriod     time.Duration `long:"update-period" default:"30m" description:"period between attempts to update data from the stamps repository"`
	DataSource       string        `long:"datasource" default:"https://github.com/gwisp2/russian-stamps.git" description:"a git repository with information about stamps"`
	DataSourceBranch string        `long:"datasource-branch" default:"main" description:"used branch of that repository"`
	FrontendFiles    string        `short:"f" long:"frontend" default:"" description:"files to copy into generated pages"`
	DeployCommand    string        `short:"d" long:"deploy-command" description:"command to run to deploy pages, use {{ .PagesPath }} to get directory with prepared website content"`
}

func (options *PipelineOptions) PrettyPrint() {
	log.Println("Stamp Finder -- updater service")
	log.Printf("Root: %s\n", options.RootPath)
	log.Printf("Data source: %s [branch %s]\n", options.DataSource, options.DataSourceBranch)
	log.Printf("Updates: every %s\n", options.UpdatePeriod)
	if options.RusmarkaDisabled {
		log.Println("Rusmarka updates: disabled")
	} else {
		log.Printf("Rusmarka updates: every %s\n", options.RusmarkaTTL)
	}
	if options.DeployCommand != "" {
		log.Println("Deploy command is provided")
	}
	if options.FrontendFiles != "" {
		log.Printf("Frontend files are copied from %s\n", options.FrontendFiles)
	}
}
