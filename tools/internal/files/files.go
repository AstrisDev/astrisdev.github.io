package files

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
)

func CopyFile(src string, dst string) error {
	bytes, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, bytes, 0o644)
}

func CopyFileToDirectory(src string, dstDir string) error {
	return CopyFile(src, path.Join(dstDir, path.Base(src)))
}

func CopyDirectoryContents(src string, dst string) error {
	files, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	for _, file := range files {
		if file.IsDir() {
			// Directory: copy recursively
			srcDir := path.Join(src, file.Name())
			dstDir := path.Join(dst, file.Name())
			err := os.Mkdir(dstDir, 0o755)
			if err != nil && !os.IsExist(err) {
				return fmt.Errorf("error copying %s: %w", srcDir, err)
			}
			err = CopyDirectoryContents(srcDir, dstDir)
			if err != nil {
				return err
			}
		} else {
			// Not a directory
			if err = CopyFileToDirectory(path.Join(src, file.Name()), dst); err != nil {
				return err
			}
		}
	}
	return nil
}

func SaveAsJsonToFile(obj interface{}, dst string) error {
	bytes, err := json.Marshal(obj)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, bytes, 0644)
}
