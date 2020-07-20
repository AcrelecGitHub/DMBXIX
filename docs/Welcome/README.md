# Welcome Screen

1. Welcome screen has the service calls responsible for QTimer and POS through Modern Connector Service.
2. this.getMetaData() - is responsible to the QTimer trigger and for AB Tasty Flagship
3. this.getUpdatedOrder() - is responsible for the data coming from the POS and used for the orderList
4. When any of the trigger from the QTimer or POS occurs, the screen moves to the orderArea Screen using goToNextPage().

Next -> [Order Area Screen](../OrderArea/README.md)