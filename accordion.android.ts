import {Color} from "color";
import * as utils from "utils/utils";
import {View} from "ui/core/view";
import * as common from "./accordion.common";
import {AccordionItem} from "./accordion.common";
global.moduleMerge(common, exports);

export class Accordion extends common.Accordion {
    private _android: android.widget.ExpandableListView;
    private _listAdapter: AccordionListAdapter;
    private _previousGroup: number = -1;

    constructor() {
        super();
        this.selectedIndexes = [];
    }

    get android() {
        return this._android;
    }

    get _nativeView() {
        return this._android;
    }

    public updateItems(oldItems: Array<AccordionItem>, newItems: Array<AccordionItem>) {}

    _createUI() {
        const that = new WeakRef(this);
        this._android = new android.widget.ExpandableListView(utils.ad.getApplicationContext());
        if (this.separatorColor) {
            this._android.setDivider(new android.graphics.drawable.ColorDrawable(new Color(this.separatorColor).android));
            this._android.setDividerHeight(1);
        }
        this._android.setGroupIndicator(null);
        this._listAdapter = new AccordionListAdapter(this);

        this._android.setOnGroupExpandListener(new android.widget.ExpandableListView.OnGroupExpandListener({
            onGroupExpand(groupPosition: number) {
                const owner = that.get();
                if (!owner.allowMultiple) {
                    owner.selectedIndex = groupPosition;
                    if ((owner._previousGroup != -1) && (groupPosition != owner._previousGroup)) {
                        owner.android.collapseGroup(owner._previousGroup);
                    }
                    owner._previousGroup = groupPosition;
                }
                owner.selectedIndexes.forEach((item, index, arr) => {
                    if (item === groupPosition) {
                        owner.selectedIndexes.slice(index, 1);
                    }

                    if (index === arr.length) {
                        owner.selectedIndexes.push(groupPosition);
                    }
                })
            }
        }));

        this._android.setOnGroupCollapseListener(new android.widget.ExpandableListView.OnGroupCollapseListener({
            onGroupCollapse(groupPosition: number) {
                const owner = that.get();
                let items = owner.selectedIndexes;

                owner.selectedIndexes = owner.selectedIndexes.map((item) => {
                    if (item != groupPosition) {
                        return item;
                    }
                });
            }
        }));


        if (this.items) {
            this.items.forEach((item, index) => {
                this._addView(item);
            });
        }

        this._android.setAdapter(this._listAdapter);

        if (this.selectedIndexes) {
            this.selectedIndexes.forEach((item) => {
                this._android.expandGroup(item);
            });
        }
    }

    addItem(view: AccordionItem) {
        this.items.push(view);
        this._addView(view);
        this._listAdapter.notifyDataSetChanged();
    }

    public _eachChildView(callback: (child: View) => boolean): void {
        if (this.items) {
            let i;
            let length = this.items.length;
            let retVal: boolean;
            for (i = 0; i < length; i++) {
                retVal = callback(this.items[i]);
                if (retVal === false) {
                    break;
                }
            }
        }
    }

}


export class AccordionListAdapter extends android.widget.BaseExpandableListAdapter {
    owner: Accordion;

    constructor(owner: Accordion) {
        super();
        this.owner = owner;
        return global.__native(this);
    }

    hasStableIds(): boolean {
        return true;
    }

    getGroupView(groupPosition: number, isExpanded: boolean, convertView: android.view.View, parent: android.view.ViewGroup) {
        if (convertView === null) {
            let item: AccordionItem = this.owner.items[groupPosition];
            if (item.headerText) {
                const header = new android.widget.TextView(this.owner._context);
                header.setText(this.owner.items[groupPosition].headerText);
                if (this.owner.headerTextAlignment === "center") {
                    header.setGravity(android.view.Gravity.CENTER);
                } else if (this.owner.headerTextAlignment === "right") {
                    header.setGravity(android.view.Gravity.RIGHT);
                } else {
                    header.setGravity(android.view.Gravity.LEFT);
                }

                if (this.owner.headerHeight) {
                    header.setHeight(this.owner.headerHeight);
                }
                if (this.owner.headerColor) {
                    header.setBackgroundColor(new Color(this.owner.headerColor).android);
                }

                if (this.owner.headerTextColor) {
                    header.setTextColor(new Color(this.owner.headerTextColor).android);
                }

                if(this.owner.headerTextSize) {
                    header.setTextSize(this.owner.headerTextSize);
                }
                return header;

            }
        }

        return convertView;

    }

    getGroupCount(): number {
        return this.owner.items.length ? this.owner.items.length : 0;
    }

    getGroupId(groupPosition: number): number {
        return new java.lang.String(this.owner.items[groupPosition].headerText).hashCode();
    }

    getChildView(groupPosition: number, childPosition: number, isLastChild: boolean, convertView: android.view.View, parent: android.view.ViewGroup) {
        return this.owner.items[groupPosition]._nativeView;
    }

    getChildId(groupPosition: number, childPosition: number): number {
        return new java.lang.String(this.owner.items[groupPosition].headerText + childPosition.toString()).hashCode();
    }

    getChildrenCount(groupPosition: number): number {
        return this.owner.items[groupPosition] ? 1 : 0;
    }

    isChildSelectable(groupPosition: number, childPosition: number) {
        return true;
    }

}
