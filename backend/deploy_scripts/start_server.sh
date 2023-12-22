source /home/ubuntu/.bashrc

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-DEV" ]
then
    cd /home/ubuntu/apidev.workybooks.com
    pm2 describe worky_api_dev
    RUNNING=$?
    if [ "${RUNNING}" -ne 0 ]; then
        pm2 start ecosystem.config.js --only worky_api_dev --env development
        pm2 save
    else
        pm2 reload ecosystem.config.js --only worky_api_dev --env test
        pm2 save
    fi
fi

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-TEST" ]
then
    cd /home/ubuntu/apitest.workybooks.com
    pm2 describe worky_api_test
    RUNNING=$?
    if [ "${RUNNING}" -ne 0 ]; then
        pm2 start ecosystem.config.js --only worky_api_test --env test
        pm2 save
    else
        pm2 reload ecosystem.config.js --only worky_api_test --env test
        pm2 save
    fi
fi

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-PROD" ]
then
    cd /home/ubuntu/api.workybooks.com
    pm2 describe worky_api
    RUNNING=$?
    if [ "${RUNNING}" -ne 0 ]; then
        pm2 start ecosystem.config.js --only worky_api --env production
        pm2 save
    else
        pm2 reload ecosystem.config.js --only worky_api --env test
        pm2 save
    fi
fi





