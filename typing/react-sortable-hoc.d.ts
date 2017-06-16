declare module "react-sortable-hoc" {
    export interface SortableContainerProps {
        axis?: "x" | "y" | "xy";
        lockAxis?: "x" | "y" | "xy";
        helperClass?: string;
        transitionDuration?: number;
        pressDelay?: number;
        pressThreshold?: number;
        distance?: number;
        shouldCancelStart?(e: React.SyntheticEvent<HTMLElement>): boolean;
        onSortStart?(info: { node: HTMLElement, index: number, collection: number | string }, e: React.SyntheticEvent<HTMLElement>): void;
        onSortMove?(e: React.SyntheticEvent<HTMLElement>): void;
        onSortEnd?(info: { oldIndex: number, newIndex: number, collection: number | string }, e: React.SyntheticEvent<HTMLElement>): void;
        useDragHandle?: boolean;
        useWindowAsScrollContainer?: boolean;
        hideSortableGhost?: boolean;
        lockToContainerEdges?: boolean;
        lockOffset?: string | [string, string];
    }

    export function SortableContainer<P>(WrappedComponent: React.ComponentType<P>): React.ComponentClass<P & SortableContainerProps>;

    export interface SortableElementProps {
        index: number;
        collection?: number | string;
        disabled?: boolean;
    }

    export function SortableElement<P>(WrappedComponent: React.ComponentType<P>): React.ComponentClass<P & SortableElementProps>;
}
