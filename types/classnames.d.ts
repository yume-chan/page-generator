declare module "classnames" {
    namespace classNames { }

    type name = string | undefined | { [key: string]: boolean };
    type names = name | name[];

    function classNames(...names: names[]): string;

    export = classNames;
}
