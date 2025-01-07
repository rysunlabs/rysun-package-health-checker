#!/usr/bin/env node
import { program as commander } from 'commander';
import path from 'path';
import { promises as fs } from 'fs'; 
import axios from 'axios';
import GitUrlParse from "git-url-parse";
import { createHTMLTemplate } from './generateHTML';
import { exec } from 'child_process';

type DependencyList = { [packageName: string]: string };
type PackageJson = { [field: string]: DependencyList };

const readPackageJson = async (dir: string): Promise<any> => {
    const file = dir.endsWith('package.json')
        ? dir
        : path.join(dir, 'package.json');
    const json = await fs.readFile(file, { encoding: 'utf8' });
    return JSON.parse(json);
};

let count = 0;
const loadingInterval = setInterval(() => {
    const spinner = ['-', '\\', '|', '/']; // rotating set of characters
    const loadingText = `Loading ${spinner[count % spinner.length]}`;
    process.stdout.write(`${loadingText}\r`); // use \r to overwrite the same line
    count++;
}, 100);

const getIssuesCount = async (owner: string, pack_name: string) => {
    try {
        const response = await axios.get(`https://api.github.com/search/issues?q=repo:${owner}/${pack_name}+type:issue+state:closed`);
        return response.data;
    } catch (error: any) {
        if (error.response.status === 403 && error.response.data.message.includes("API rate limit exceeded")) {
            const resetTime = new Date(error.response.headers['x-ratelimit-reset'] * 1000);
            console.log(`Rate limit exceeded. Waiting until ${resetTime.toLocaleTimeString()} before retrying...`);
            await new Promise(resolve => setTimeout(resolve, (resetTime.getTime() - Date.now()) + 1000));
            return await getIssuesCount(owner, pack_name); // Retry after the delay
        } else if (error.response.status === 422 && error.response.data.message.includes("Validation Failed")) {
            const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${pack_name}`);
            const repoOwner = GitUrlParse(repoResponse.data.html_url).owner;
            const repoName = GitUrlParse(repoResponse.data.html_url).name;
            return await getIssuesCount(repoOwner, repoName);
        } else {
            throw new Error(error.response.data.message);
        }
    }
};

const checkLastModifiedDate = (modifiedDate: any) => {
    const currDate: any = new Date();
    const date: any = new Date(modifiedDate);
    const diffTime = Math.abs(currDate - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);
    let msg = "";
    if (months === 0) {
        msg = `${diffDays} days ago`;
    } else if (years > 0) {
        msg = `${years} years ago`;
    } else {
        msg = `${months} months ago`;
    }
    const isThreeMonthAgo = months > 3 || years > 0;
    return [msg, isThreeMonthAgo];
};

const getDetails = async (data: any, name: string, version: string) => {
    let packageData: any = {};
    for (let i of data) {
        if (i.package.name && name && i.package.name === name) {
            let issueData: any;
            if (i.package.links.repository) {
                const pack_name = GitUrlParse(i.package.links.repository).name;
                const owner = GitUrlParse(i.package.links.repository).owner;
                issueData = await getIssuesCount(owner, pack_name);
            }
            const downloadCount = await axios.get(`https://api.npmjs.org/downloads/point/last-week/${name}`);
            const [msg, isThreeMonthAgo] = checkLastModifiedDate(i.package.date);
            packageData = {
                'git_url': i.package.links.repository ? i.package.links.repository : "",
                'npm_url': i.package.links.npm,
                'downloaded_version': version.replace(/^\D+/g, ''),
                'curr_version': i.package.version,
                'last_published': msg,
                'open_issues': issueData?.total_count ? issueData.total_count : "",
                'weekly_downloads': downloadCount.data.downloads,
                'isThreeMonthAgo': isThreeMonthAgo,
                'quality': i.score.detail.quality,
                "popularity": i.score.detail.popularity,
                "maintenance": i.score.detail.maintenance,
                "final": i.score.final
            };
        }
    }
    return packageData;
};

const upgrade = async (packageJson: PackageJson) => {
    let packageData: any = {};
    const DependencyList = ['peerDependencies', 'devDependencies', 'dependencies'];
    for (let a of DependencyList) {
        const packages = packageJson[a];
        const entries = packages ? Object.entries(packages) : [];

        for (const [name, version] of entries) {
            const data = await axios.get(`https://registry.npmjs.org/-/v1/search?text=${name}`);
            if (data) {
                packageData[name] = await getDetails(data.data.objects, name, version);
            }
        }
    }
    console.log("dependencies", DependencyList);

    const htmlData = createHTMLTemplate(packageData);

    await fs.writeFile(`./report.html`, htmlData); 
    exec(`start "" "./report.html"`);
};

(async () => {
    const packageJsonFile = (commander as any).path || process.cwd();
    const packageJson = await readPackageJson(packageJsonFile) as PackageJson;

    await upgrade(packageJson);
    clearInterval(loadingInterval); // stop the loading animation
    console.log('Done!                     ');
})();
