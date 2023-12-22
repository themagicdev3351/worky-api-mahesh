source /home/ubuntu/.bashrc

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-DEV" ]
then
    yes | cp -rf /home/ubuntu/temp/. /home/ubuntu/apidev.workybooks.com
    chown -R ubuntu:ubuntu /home/ubuntu/apidev.workybooks.com

    cd /home/ubuntu/apidev.workybooks.com
    npm install
fi

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-TEST" ]
then
   yes | cp -rf /home/ubuntu/temp/. /home/ubuntu/apitest.workybooks.com
    chown -R ubuntu:ubuntu /home/ubuntu/apitest.workybooks.com

    cd /home/ubuntu/apitest.workybooks.com
    npm install
fi

if [ "$DEPLOYMENT_GROUP_NAME" == "WORKY-API-PROD" ]
then
    yes | cp -rf /home/ubuntu/temp/. /home/ubuntu/api.workybooks.com
    chown -R ubuntu:ubuntu /home/ubuntu/api.workybooks.com

    cd /home/ubuntu/api.workybooks.com
    npm install
fi