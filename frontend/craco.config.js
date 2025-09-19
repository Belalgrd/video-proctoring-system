// frontend/craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings for TensorFlow packages
      webpackConfig.ignoreWarnings = [
        {
          module: /@tensorflow/,
          message: /Failed to parse source map/,
        },
        {
          module: /tensorflow/,
          message: /Failed to parse source map/,
        },
      ];

      // Alternative: Disable source-map-loader for TensorFlow packages
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((oneOf) => {
            if (
              oneOf.use &&
              oneOf.use.some((use) => 
                use.loader && use.loader.includes('source-map-loader')
              )
            ) {
              oneOf.exclude = [
                ...(oneOf.exclude || []),
                /@tensorflow/,
                /tensorflow/
              ];
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};