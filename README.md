# Sawmill

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

This server allows you to collect logs from various sources.

## Features

- Simple and straightforward setup.
- Send single log entries or a batch of them.
- Sane pre-processing to add extra metadata to the logs.
- Complete freedom over the schema customization of logs.
- See logs in realtime as they arrive, on stackdriver logging.

## How to use

- Deploy the project on cloud run using the button above. This will deploy the app to your choice of Google Cloud project along with other sane defaults.
  ![sawmill-deployment-on-cloud-run](https://user-images.githubusercontent.com/1330677/126078285-acb98123-efcb-4890-ad8a-f8eaa7b1ce44.png)

- Start sending POST requests to get logs on your server.

### Sample

The following request:

```sh
curl --location --request POST 'https://YOUR_APP_URL/' \
--header 'Content-Type: application/json' \
--data-raw '[{
    "user": {
        "id": "unique_user_id"
    },
    "action": "login",
    "product": "website",
    "level": "debug",
    "message": "User navigated to login page.",
    "timestamp": "2021-07-18T18:11:01.050Z"
},{
    "user": {
        "id": "unique_user_id"
    },
    "action": "error",
    "product": "website",
    "level": "error",
    "message": "User couldn't login.",
    "timestamp": "2021-07-18T18:12:04.110Z"
}]'
```

Will show up as following:
![sample-log-on-stackdriver-logging](https://user-images.githubusercontent.com/1330677/126078412-d42dfffe-5fe8-43b6-91cb-9a74940fffe7.png)

Notes about sample:

- This is a sample for batch request. You can use the same format but only include 1 message in post request to make it streaming.
- Max request size limit is 32mb and is imposed by cloud run. If you are using other service to deploy the project, check it's documentation to get the correct size limits.
- Timestamp key here is the timestamp on user's device. It's ISO timestamped. Project will use this timestamp to override stackdriver's timestamp. This allows you to see logs based on the same order as they were collected, even if they were sent as a batch.
- Level corresponds to [stackdriver log severity levels](https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity). They allow you to quickly filter logs based on a level on stackdriver logging dashboard.
- Message corresponds to the message shown on stackdriver log message. I would suggest always having message key with an easy to read string message.
- All other keys can be customized based on what you and your team determines to best suit the level of granularity.
