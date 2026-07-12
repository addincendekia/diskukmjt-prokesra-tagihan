function _getAppConfig() {
  const props = PropertiesService.getScriptProperties();

  const config = {
    fileSourceId:
      props.getProperty(PROPERTY_KEYS.FILE_ID_SOURCE) || FILE_ID_SOURCE,
    fileSourceId2025:
      props.getProperty(PROPERTY_KEYS.FILE_ID_SOURCE_2025) ||
      FILE_ID_SOURCE_2025,
    fileSourceIdRekapitulasi:
      props.getProperty(PROPERTY_KEYS.FILE_ID_REKAPITULASI) ||
      FILE_ID_REKAPITULASI,
    defaultPeriodYear: Number(
      props.getProperty(PROPERTY_KEYS.DEFAULT_PERIOD_YEAR) ||
        DEFAULT_PERIOD_YEAR,
    ),
    defaultRateSubsidi: Number(
      props.getProperty(PROPERTY_KEYS.DEFAULT_RATE_SUBSIDI) ||
        DEFAULT_RATE_SUBSIDI,
    ),
  };

  if (!props.getProperty(PROPERTY_KEYS.FILE_ID_SOURCE)) {
    props.setProperty(PROPERTY_KEYS.FILE_ID_SOURCE, config.fileSourceId);
  }
  if (!props.getProperty(PROPERTY_KEYS.FILE_ID_SOURCE_2025)) {
    props.setProperty(
      PROPERTY_KEYS.FILE_ID_SOURCE_2025,
      config.fileSourceId2025,
    );
  }
  if (!props.getProperty(PROPERTY_KEYS.FILE_ID_REKAPITULASI)) {
    props.setProperty(
      PROPERTY_KEYS.FILE_ID_REKAPITULASI,
      config.fileSourceIdRekapitulasi,
    );
  }
  if (!props.getProperty(PROPERTY_KEYS.DEFAULT_PERIOD_YEAR)) {
    props.setProperty(
      PROPERTY_KEYS.DEFAULT_PERIOD_YEAR,
      String(config.defaultPeriodYear),
    );
  }
  if (!props.getProperty(PROPERTY_KEYS.DEFAULT_RATE_SUBSIDI)) {
    props.setProperty(
      PROPERTY_KEYS.DEFAULT_RATE_SUBSIDI,
      String(config.defaultRateSubsidi),
    );
  }

  FILE_ID_SOURCE = config.fileSourceId;
  FILE_ID_SOURCE_2025 = config.fileSourceId2025;
  FILE_ID_REKAPITULASI = config.fileSourceIdRekapitulasi;
  DEFAULT_PERIOD_YEAR = config.defaultPeriodYear;
  DEFAULT_RATE_SUBSIDI = config.defaultRateSubsidi;

  return config;
}
