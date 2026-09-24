const { withPodfile } = require('expo/config-plugins');

const MINIMUM_IOS_VERSION = '16.4';
const MARKER = '# Raise pod targets to the app deployment target.';

module.exports = function withIosPodDeploymentTarget(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes(MARKER)) {
      return config;
    }

    const postInstallEnd = contents.lastIndexOf('\n  end\nend');
    if (postInstallEnd === -1) {
      throw new Error('Could not find the post_install block in ios/Podfile');
    }

    const override = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_configuration|
        deployment_target = build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if deployment_target && Gem::Version.new(deployment_target) < Gem::Version.new('${MINIMUM_IOS_VERSION}')
          build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM_IOS_VERSION}'
        end
      end
    end`;

    config.modResults.contents =
      contents.slice(0, postInstallEnd) +
      override +
      contents.slice(postInstallEnd);
    return config;
  });
};
