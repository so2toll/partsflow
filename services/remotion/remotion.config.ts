import { Config } from '@remotion/cli/config';

// Set the public directory to 'assets' instead of default 'public'
Config.setPublicDir('./assets');

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
