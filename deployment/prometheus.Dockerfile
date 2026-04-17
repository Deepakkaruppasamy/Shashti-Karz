FROM prom/prometheus:latest
COPY prometheus/prometheus.yml /etc/prometheus/prometheus.yml
COPY prometheus/alerts.rules.yml /etc/prometheus/alerts.rules.yml
ENTRYPOINT [ "/bin/prometheus" ]
CMD [ "--config.file=/etc/prometheus/prometheus.yml", \
      "--storage.tsdb.path=/prometheus", \
      "--web.console.libraries=/usr/share/prometheus/console_libraries", \
      "--web.console.templates=/usr/share/prometheus/console_templates", \
      "--web.enable-lifecycle" ]
