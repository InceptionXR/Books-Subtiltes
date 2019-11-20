class Logger {
  info(message) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
const logger = new Logger();

module.exports = {
  logger
};
