const  winston =   require('winston');
const { combine, timestamp, json, printf } = winston.format;
const timestampFormat = 'MMM-DD-YYYY HH:mm:ss';



exports.logger = winston.createLogger({
    format: combine(
      timestamp({ format: timestampFormat }),
      json(),
      printf(({ timestamp, level, message, ...data }) => {
        const response = {
          level,
          timestamp,
          message,
          data,
        };
  
        return JSON.stringify(response);
      })
    ),
    // store logs in the console
    transports: [
      new winston.transports.Console()
    ],
});


exports.formatLoggerResponse = (req, res, responseBody) => {
    return {
      request: {
        host: req.headers.host,
        baseUrl: req.baseUrl,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req?.params,
        query: req?.query,
        clientIp:
          req?.headers?.ForwardedFor ?? req?.socket.remoteAddress,
      },
      response: {
         ...responseBody,
      }
    };
  };

