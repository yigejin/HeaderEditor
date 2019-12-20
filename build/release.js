const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const publishRelease = require('publish-release');
const rootDir = path.resolve(__dirname, '..');
const package = require('../package.json');
const output = path.resolve(rootDir, 'dist-pack');
const config = require('./extension-config').config;

if (!package.webextension.github.enable) {
	console.log("GitHub not enabled");
	process.exit(0);
}

const assets = [];
let content = "";

const assetName = package.webextension.dist.replace('{VER}', package.version);

['crx', 'xpi'].forEach(extName => {
	const outputPath = path.resolve(output, assetName + '.' + extName);
	if (fs.existsSync(outputPath)) {
		assets.push(outputPath);
		content += assetName + '.' + extName + ' sha256:';
		const buffer = fs.readFileSync(outputPath);
		const fsHash = crypto.createHash('sha256');
		fsHash.update(buffer);
		content += fsHash.digest('hex') + "\n";
	}
});

// Get git names
const gitName = package.repository.url.match(/(\w+)\/(\w+)\.git/);
const tagName = package.webextension.github.tag.replace('{VER}', package.version);

publishRelease({
	token: process.env[config.github.token],
	owner: gitName[1],
	repo: gitName[2],
	tag: tagName,
	name: package.version,
	notes: content,
	draft: false,
	prerelease: false,
	reuseRelease: false,
	reuseDraftOnly: false,
	skipAssetsCheck: false,
	skipDuplicatedAssets: false,
	skipIfPublished: true,
	editRelease: false,
	deleteEmptyTag: false,
	assets: assets
}, function (err, release) {
	if (err) {
		console.error("release failed!");
		console.error(err);
	} else {
		console.log(release.html_url);
	}
})