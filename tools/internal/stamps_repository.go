package sf

import (
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"log"
	"os"
)

const (
	defaultRemoteName = "origin"
)

type StampsRepository struct {
	Path       string
	RemoteUrl  string
	BranchName string
	repo       *git.Repository
}

func (stampsRepo *StampsRepository) tryCheckOut() error {
	worktree, err := stampsRepo.repo.Worktree()
	if err != nil {
		return fmt.Errorf("error getting worktree: %w", err)
	}
	return worktree.Checkout(&git.CheckoutOptions{
		Branch: plumbing.NewRemoteReferenceName(defaultRemoteName, stampsRepo.BranchName),
	})
}

func (stampsRepo *StampsRepository) EnsureCloned() error {
	// Open existing repository
	repo, err := git.PlainOpen(stampsRepo.Path)
	if err != nil && err != git.ErrRepositoryNotExists {
		return fmt.Errorf("error opening git repository: %w", err)
	}

	// Check that repository remote is correct
	needsClone := repo == nil
	if repo != nil {
		remote, err := repo.Remote(defaultRemoteName)
		if err != nil {
			return fmt.Errorf("error getting remote %s: %v", defaultRemoteName, err)
		}
		remoteUrl := remote.Config().URLs[0]
		if remoteUrl != stampsRepo.RemoteUrl {
			log.Println("current cloned repository has wrong remote url, repository will be removed")
			needsClone = true
		}
	}

	// Clone repository
	if needsClone {
		if err = os.RemoveAll(stampsRepo.Path); err != nil {
			return fmt.Errorf("error removing old repository at %s: %w", stampsRepo.Path, err)
		}
		repo, err = git.PlainClone(stampsRepo.Path, false, &git.CloneOptions{
			URL:        stampsRepo.RemoteUrl,
			RemoteName: defaultRemoteName,
			Progress:   os.Stdout,
		})
		if err != nil {
			return fmt.Errorf("error cloning %s: %w", stampsRepo.RemoteUrl, err)
		}
	}

	// Populate stampsRepo.repo
	stampsRepo.repo = repo

	// Check out branch
	if err = stampsRepo.tryCheckOut(); err != nil {
		if err != git.ErrBranchNotFound {
			return fmt.Errorf("error checking out %s: %w", stampsRepo.BranchName, err)
		}
		// Branch does not exist yet. Try fetching.
		err = repo.Fetch(&git.FetchOptions{RemoteName: defaultRemoteName})
		if err != nil {
			return fmt.Errorf("error fetching %s: %w", defaultRemoteName, err)
		}
		// Try to check out again
		if err = stampsRepo.tryCheckOut(); err != nil {
			return fmt.Errorf("error checking out %s: %w", stampsRepo.BranchName, err)
		}
	}

	return nil
}

func (stampsRepo *StampsRepository) FetchUpdates() error {
	if stampsRepo.repo == nil {
		return fmt.Errorf("stampsRepo.repo == nil")
	}
	oldHead, err := stampsRepo.repo.Head()
	if err != nil {
		return err
	}
	if err := stampsRepo.repo.Fetch(&git.FetchOptions{RemoteName: defaultRemoteName}); err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("error fetching remote: %w", err)
	}
	err = stampsRepo.tryCheckOut()
	if err != nil {
		return fmt.Errorf("error checking out: %w", err)
	}
	newHead, err := stampsRepo.repo.Head()
	if err != nil {
		return err
	}
	if newHead.Hash() == oldHead.Hash() {
		return NoErrAlreadyUpToDate
	} else {
		return nil
	}
}
