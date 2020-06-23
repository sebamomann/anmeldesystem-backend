module.exports = {
    basic: function(_driver) {
        let driver;

        driver = (({
                       seats,
                       service

                   }) => ({
            seats,
            service
        }))
        (_driver);

        return driver;
    },
};
