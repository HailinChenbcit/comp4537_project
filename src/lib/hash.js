import crypto from "crypto";


/**
 * Example:
 * hashcode = hash(req.body.password)
 * storetomongodb(req.body.username, hashcode)
 */
export function hash(token) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(token, salt, 100000, 64, "sha256").toString("hex");

    return `100000:${salt}:${hash}`;
}

/**
 * Example:
 * const user = getdatafrommongodb();
 * const isValid = compare(req.body.password, user.password)
 * if(isValid) {
 *    do something
 * } else {
 *     error
 * }
 */
export function compare(inputPassword, storedHash) {
    let [iterations, salt, storedPassword] = storedHash.split(":");
    iterations = parseInt(iterations);
    const hash = crypto.pbkdf2Sync(inputPassword, salt, iterations, 64, "sha256").toString("hex");
    return hash === storedPassword;
}


