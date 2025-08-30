package main

import (
	"fmt"
	"github.com/jessevdk/go-flags"
	"os"
	sf "sf/internal"
)

func main() {
	var options sf.PipelineOptions
	remainingArgs, err := flags.Parse(&options)
	if err != nil {
		// go-flags prints error message
		os.Exit(1)
	}
	if len(remainingArgs) != 0 {
		_, _ = fmt.Fprintf(os.Stderr, "Unparsed args remaining: %s\n", remainingArgs)
		os.Exit(1)
	}
	pipeline := sf.NewPipeline(&options)
	pipeline.RunLoop()
}
