package exec

func performOSChecks(_ string) error {
	if disableFreeBSDChecks {
		return nil
	}
	return nil
}
