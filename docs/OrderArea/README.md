# OrderArea has three sections:

## Not during the busy time:
1. List of Items/Products, example burgers etc with the details of price and calories - template used (app-buttons-list)
2. Recommendations - Items that are coming from a recommendation engine through AWS service configured in cloud, based on the time of the day and weather. - template used (app-popular-items)
3. Banner Image which is replaced by the order list area once the order is started
    - Banner Image
    - Order List 
    - For You section (A section to display the items based on the users history of products that have been bought together and is coming from the recommendation engine in future)
- template used (app-ab-banner)

## During the busy time:
1. The difference during the busy time is, instead of the Items/Products list there will be a video using the template (app-busy-time)

Next -> [Confirm Order Screen](../ConfirmOrder/README.md)