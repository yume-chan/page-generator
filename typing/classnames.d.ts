declare module "classnames" {
    namespace classNames { }

    type name = string | undefined | { [key: string]: boolean | undefined };
    type names = name | name[];

    function classNames(...names: names[]): string;

    export = classNames;
}
