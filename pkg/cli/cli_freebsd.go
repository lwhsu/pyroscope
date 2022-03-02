package cli

import (
	"os"
	"path/filepath"
)

func defaultAgentConfigPath() string {
	return "/usr/local/etc/pyroscope/agent.yml"
}

func defaultAgentLogFilePath() string { return "" }

func getInstallPrefix() string {
	executablePath, err := os.Executable()
	if err != nil {
		// TODO: figure out what kind of errors might happen, handle it
		return ""
	}

	return filepath.Clean(filepath.Join(executablePath, "../"))
}

func resolvePath(path string) string {
	if res, err := filepath.EvalSymlinks(path); err == nil {
		return res
	}
	return path
}
