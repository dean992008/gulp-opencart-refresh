const request = require('request');
const through = require('through2').obj;
const gutil = require('gulp-util');
const getQueryParam = require('get-query-param');

let options;
let cookie_jar = request.jar();

function getKey() {
    return new Promise((resolve, reject) => {
        request({
            url: options.url + '/admin/index.php?route=common/login',
            jar: cookie_jar,
            method: 'POST',
            form: {
                username: options.login,
                password: options.password
            }
        })
            .on('response', (response) => {
                if (typeof response.headers.location === 'undefined')
                    reject("Can't get token. Login or password incorrect");
                else
                    resolve(getQueryParam('token', response.headers.location));
            })
            .on('error', (err)=>{
                reject(err);
            });
    });
}

function refreshCache(key) {
    return new Promise((resolve, reject) => {
        request({
            url: options.url + '/admin/index.php?route=extension/modification/refresh&token=' + key,
            jar: cookie_jar,
            method: 'GET'
        })
            .on('response', (response) => {
                resolve(true);
            })
            .on('error', (err)=>{
                reject(err);
            });
    });
}

function logout(key){
    return new Promise((resolve, reject) => {
        request({
            url: options.url + '/admin/index.php?route=common/logout&token=' + key,
            jar: cookie_jar,
            method: 'GET'
        })
            .on('response', (response)=>{
                resolve(true);
            })
            .on('error', (err)=>{
                reject(err);
            });
    });
}


function opencartRefresh(setting) {
    if (!setting.url) {
        throw new gutil.PluginError('gulp-opencart-refresh', '`url` is required!');
    }
    if (!setting.login) {
        throw new gutil.PluginError('gulp-opencart-refresh', '`login` is required!');
    }
    if (!setting.password) {
        throw new gutil.PluginError('gulp-opencart-refresh', '`password` is required!');
    }
    options = setting;
    getKey()
        .then(refreshCache)
        .then(logout)
        .then((result) => {
            const time = new Date();
            const now = `[${time.getHours}:${time.getMinutes}:${time.setSeconds}] `;
            (result) ? console.log(now + 'Cache was cleared') : console.log(now + 'Something wrong');
        })
        .catch((error) => {
            throw new gutil.PluginError('gulp-opencart-refresh', error);
        });
    return through(function (file, encoding, callback) {
        callback(null, file);
    });
}

module.exports = opencartRefresh;