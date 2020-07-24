export class DomainUtil {

    public static replaceDomain = function(domain: String, ...args) {
        args.forEach((fArg, index) => {
            domain = domain.replace('{{' + index + '}}', args[index]);
        });

        return domain;
    };
}
