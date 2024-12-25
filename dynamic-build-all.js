import { projects } from '/projectConfig.js';
import { execSync } from 'child_process';
const projectNames = Object.keys(projects);
for (const projectName of projectNames) {
    console.log(`Building ${projectName}...`);
    const command = projects[projectName].buildCommand;
    execSync(command, { stdio: 'inherit' });
}