FROM prom/alertmanager:latest
COPY alertmanager/config.yml /etc/alertmanager/config.yml
# The Slack webhook secret should be mounted as a secret file at /etc/alertmanager/slack_webhook.txt in the cloud provider
CMD [ "--config.file=/etc/alertmanager/config.yml", "--storage.path=/alertmanager" ]
