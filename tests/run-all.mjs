// Runs every integration test against the code in this repository and exits 1 if any fails.
// Database: in-memory MongoDB (mongodb-memory-server), never the real one. Emails: stubs / Ethereal.
// Needs `npm ci` in Server/, client/ and tests/.  Usage: node tests/run-all.mjs
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(TESTS_DIR, '..');
const TIMEOUT_MS = 180_000;

/** Server API tests, then client modules run in Node */
const TESTS = [
    'test.js',
    'clubtest.js',
    'orderemailtest.js',
    'clubmailtest.js',
    'welcometest.js',
    'popuptest.js',
    'photopricingtest.js',
    'broadcastdowntest.js',
    'paymenttest.js',
    'pricetest.js',
    'closedroutestest.js',
    'retentiontest.js',
    'clubdiscounttest.js',
    'tipsimporttest.js',
    { file: 'emailprovidertest.js', env: { NODE_ENV: 'production' } },
    'cartmergetest.mjs',
    'cartlogintest.mjs',
    'queuetest.mjs',
];

// The upload queue is tested with a stub uploader instead of Cloudinary
writeFileSync(
    join(TESTS_DIR, 'uploadQueue.mjs'),
    readFileSync(join(REPO, 'client/src/utils/uploadQueue.js'), 'utf8').replace("from './cloudinaryUpload'", "from './stubUploader.mjs'"),
);

function runTest({ file, env = {} }) {
    return new Promise((done) => {
        const child = spawn(process.execPath, [file], {
            cwd: TESTS_DIR,
            env: { ...process.env, REPO, SERVER: join(REPO, 'Server'), ...env },
        });
        let output = '';
        child.stdout.on('data', (chunk) => { output += chunk; });
        child.stderr.on('data', (chunk) => { output += chunk; });
        const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
        child.on('close', (code) => {
            clearTimeout(timer);
            done({ file, passed: code === 0 && /PASSED/.test(output), output });
        });
    });
}

const results = [];
for (const entry of TESTS) {
    const test = typeof entry === 'string' ? { file: entry } : entry;
    const result = await runTest(test);
    const summary = result.output.split('\n').filter((line) => /PASSED|FAIL/.test(line)).pop() || '(no result line)';
    console.log(`${result.passed ? '✓' : '✗'} ${test.file.padEnd(22)} ${summary.trim()}`);
    results.push(result);
}

const failed = results.filter((result) => !result.passed);
if (failed.length) {
    for (const { file, output } of failed) {
        console.error(`\n----- ${file} -----\n${output.split('\n').slice(-40).join('\n')}`);
    }
    console.error(`\n${failed.length} of ${results.length} test suites failed`);
    process.exit(1);
}
console.log(`\nAll ${results.length} test suites passed`);
