/**
 * @author chander, adapted by SIDGEY
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------- MULTI GROUPING STORE ----------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////////////////////////////////
Ext.ns('Ext.ux.grid');
Ext.ux.grid.MultiGroupingStore = Ext.extend(Ext.data.GroupingStore, {
						constructor: function(config) { Ext.ux.grid.MultiGroupingStore.superclass.constructor.apply(this, arguments); },
						sortInfo: [],
						sort: function(field, dir) {
						    var f = [];
						    if (Ext.isArray(field)) { for (var i = 0, len = field.length; i < len; ++i) { f.push(this.fields.get(field[i])); } }
						    else { f.push(this.fields.get(field)); }
						    if (f.length < 1) { return false; }
						    if (!dir) {
							if (this.sortInfo && this.sortInfo.length > 0 && this.sortInfo[0].field == f[0].name) {
							    // toggle sort direction
							    dir = (this.sortToggle[f[0].name] || "ASC").toggle("ASC", "DESC");
							}
							else
							    dir = f[0].sortDir;
						    }
						    var st = (this.sortToggle) ? this.sortToggle[f[0].name] : null;
						    var si = (this.sortInfo) ? this.sortInfo : null;
						    this.sortToggle[f[0].name] = dir;
						    this.sortInfo = [];
						    for (i = 0, len = f.length; i < len; ++i) {
							this.sortInfo.push({ field: f[i].name, direction: dir });
						    }
						    if (!this.remoteSort) {
							this.applySort();
							this.fireEvent("datachanged", this);
						    }
						    else {
							if (!this.load(this.lastOptions)) {
							    if (st) { this.sortToggle[f[0].name] = st; }
							    if (si) { this.sortInfo = si; }
							}
						    }
						    return true;
						},
						setDefaultSort: function(field, dir) {
						    dir = dir ? dir.toUpperCase() : "ASC";
						    this.sortInfo = [];
						    if (!Ext.isArray(field)) { this.sortInfo.push({ field: field, direction: dir }); }
						    else {
							for (var i = 0, len = field.length; i < len; ++i) {
							    this.sortInfo.push({ field: field[i].field, direction: dir });
							    this.sortToggle[field[i]] = dir;
							}
						    }
						},
						groupBy: function(field, forceRegroup) {
						    if (!forceRegroup && this.groupField == field)
							return; // already grouped by this field
						    if (this.groupField) {
							if (this.groupField.indexOf(field) > 0) {
							    return;
							}
							this.groupField.push(field);
						    }
						    else { this.groupField = [field]; }
						    if (this.remoteGroup) {
							if (!this.baseParams) { this.baseParams = {}; }
							this.baseParams['groupBy'] = field;
						    }
						    if (this.groupOnSort) { this.sort(field); return; }
						    if (this.remoteGroup) { this.reload(); }
						    else {
							var si = this.sortInfo || [];
							if (si.field != field) { this.applySort(); }
							else { this.sortData(field); }
							this.fireEvent('datachanged', this);
						    }
						},
						applySort: function() {
						    var si = this.sortInfo;
						    if (si && si.length > 0 && !this.remoteSort) { this.sortData(si, si[0].direction); }
						    if (!this.groupOnSort && !this.remoteGroup) {
							var gs = this.getGroupState();
							if (gs && gs != this.sortInfo) { this.sortData(this.groupField); }
						    }
						},
						getGroupState: function() {
						    return this.groupOnSort && this.groupField !== false ? (this.sortInfo ? this.sortInfo : undefined) : this.groupField;
						},
						sortData: function(flist, direction) {
						    direction = direction || 'ASC';
						    var st = [];
						    var o;
						    for (var i = 0, len = flist.length; i < len; ++i) {
							o = flist[i];
							if (o instanceof Array)
							continue;
							st.push(this.fields.get(o.field ? o.field : o).sortType);
						    }
						    var fn = function(r1, r2) {
							var v1 = [];
							var v2 = [];
							var len = flist.length;
							var o;
							var name;
							for (i = 0; i < len; ++i) {

							    o = flist[i];
							    if (o instanceof Array)
								continue;

							    name = o.field ? o.field : o;
							    v1.push(st[i](r1.data[name]));
							    v2.push(st[i](r2.data[name]));
							}
							var result;
							for (i = 0; i < len; ++i) {
							    result = v1[i] > v2[i] ? 1 : (v1[i] < v2[i] ? -1 : 0);
							    if (result !== 0) { return result; }
							}
							return result; // if it gets here, that means all fields are equal
						    };
						    this.data.sort(direction, fn);
						    if (this.snapshot && this.snapshot != this.data) { this.snapshot.sort(direction, fn); }
						}
					    });
Ext.ux.grid.MultiGroupingView = Ext.extend(Ext.grid.GroupingView, {
					       constructor: function(config) {
						   Ext.ux.grid.MultiGroupingView.superclass.constructor.apply(this, arguments);
						   // Added so we can clear cached rows each time the view is refreshed
						   this.on("beforerefresh", function() {
							       if (this.rowsCache)
								   delete rowsCache;
							   }, this);
					       },
					       get_column_by_id: function(id) {
						   for (i in this.cm.lookup) {
						       if (this.cm.lookup[i].dataIndex == id)
							   return this.cm.lookup[i];
						   }
						   return null;
					       },
					       getGroups: function() {
						   return Ext.DomQuery.select("div.x-grid-group", this.mainBody.dom);
					       }
					       , displayEmptyFields: false
					       , displayFieldSeperator: ', '
					       , renderRows: function() {
						   var groupField = this.getGroupField();
						   var eg = !!groupField;
						   // if they turned off grouping and the last grouped field is hidden
						   if (this.hideGroupedColumn) {
						       var colIndexes = [];
						       for (var i = 0, len = groupField.length; i < len; ++i) {
							   var cidx = this.cm.findColumnIndex(groupField[i]);
							   if (cidx >= 0) { colIndexes.push(cidx); }
						       }
						       if (!eg && this.lastGroupField !== undefined) {
							   this.mainBody.update('');
							   for (var i = 0, len = this.lastGroupField.length; i < len; ++i) {
							       var cidx = this.cm.findColumnIndex(this.lastGroupField[i]);
							       if (cidx >= 0) { this.cm.setHidden(cidx, false); }
							   }
							   delete this.lastGroupField;
							   delete this.lgflen;
						       }
						       else if (eg && colIndexes.length > 0 && this.lastGroupField === undefined) {
							   this.lastGroupField = groupField;
							   this.lgflen = groupField.length;
							   for (var i = 0, len = colIndexes.length; i < len; ++i)
							       this.cm.setHidden(colIndexes[i], true);
						       }
						       else if (eg && this.lastGroupField !== undefined &&
								(groupField !== this.lastGroupField || this.lgflen != this.lastGroupField.length)) {
							   this.mainBody.update('');
							   for (var i = 0, len = this.lastGroupField.length; i < len; ++i) {
							       var cidx = this.cm.findColumnIndex(this.lastGroupField[i]);
							       if (cidx >= 0) { this.cm.setHidden(cidx, false); }
							   }
							   this.lastGroupField = groupField;
							   this.lgflen = groupField.length;
							   for (var i = 0, len = colIndexes.length; i < len; ++i) {
							       this.cm.setHidden(colIndexes[i], true);
							   }
						       }
						   }
						   return Ext.ux.grid.MultiGroupingView.superclass.renderRows.apply(this, arguments);
					       }
					       ,
					       // this collection keeps a fast reference for group memberships for each record
					       // it is not kept in the record since it would be destroyed during edit
					       // it is used to do a fast update of summaries
					       record_memberships: []
					       /** This sets up the toolbar for the grid based on what is grouped
						* It also iterates over all the rows and figures out where each group should appeaer
						* The store at this point is already stored based on the groups.
						*/
					       , doRender: function(cs, rs, ds, startRow, colCount, stripe) {
						   // var ss = this.grid.getTopToolbar();
						   if (rs.length < 1) { return ''; }
						   var groupField = this.getGroupField();
						   // for (var gf = 0; gf < groupField.length; gf++) {
						   // var fieldName = groupField[gf];
						   // if (fieldName == null) {
						   // groupField(gf).remove();
						   // }
						   // }
						   var gfLen = 0;
						   if (groupField) {
						       gfLen = groupField.length;
						   }
						   for (var i = 0; i < cs.length; i++)
						       cs[i].style = this.getColumnStyle(i, false);
						   // ss.removeAll();
						   // if (gfLen == 0)
						   // ss.addItem(new Ext.Toolbar.TextItem("Drop Columns Here To Group"));
						   // else {
						   // // Add back all entries to toolbar from GroupField[] 
						   // ss.addItem(new Ext.Toolbar.TextItem("Grouped By:"));
						   // for (var gfi = 0; gfi < gfLen; gfi++) {
						   // var t = groupField[gfi];
						   // if (gfi >= 0) {
						   // ss.addItem(new Ext.Toolbar.Separator());
						   // var b = new Ext.Toolbar.Button({
						   // fieldName: t,
						   // text: this.get_column_by_id(t).header
						   // });
						   // ss.addButton(b);
						   // }
						   // }
						   // }
						   // ss.doLayout(); // <- is required after adding a new component - by Dalton Jorge
						   this.enableGrouping = !!groupField;
						   if (!this.enableGrouping || this.isUpdating)
						       return Ext.grid.GroupingView.superclass.doRender.apply(this, arguments);
						   var gstyle = 'width:' + this.getTotalWidth() + ';';
						   var gidPrefix = this.grid.getGridEl().id;
						   var groups = [], curGroup, i, len, gid;
						   var lastvalues = [];
						   var added = 0;
						   var currGroups = [];
						   // Create a specific style
						   var st = Ext.get(gidPrefix + "-style");
						   if (st)
						       st.remove();
						   var html_code =
						       "div#" + gidPrefix +
						       " div.x-grid3-row {padding-left:" + (gfLen * 12) + "px}" +
						       "div#" + gidPrefix + " div.x-grid3-header {padding-left:" + (gfLen * 12) + "px}";
						   Ext.getDoc().child("head").createChild({
											      tag: 'style',
											      id: gidPrefix + "-style",
											      html: html_code
											  });
						   // traverse all rows in grid
						   for (var i = 0, len = rs.length; i < len; i++) {
						       added = 0;
						       var rowIndex = startRow + i;
						       var r = rs[i];
						       var differ = 0;
						       var gvalue = [];
						       var fieldName;
						       var fieldLabel;
						       var grpFieldNames = [];
						       var grpFieldLabels = [];
						       var v;
						       var changed = 0;
						       var addGroup = [];
						       var member_of_groups = [];
						       this.record_memberships[r.id] = member_of_groups;
						       // check group fields to see if we have a different group
						       for (var j = 0; j < gfLen; j++) {
							   fieldName = groupField[j];
							   fieldLabel = this.get_column_by_id(fieldName).header;
							   v = r.data[fieldName];
							   if (v) {
							       if (i == 0) {
								   // First record always starts a new group
								   addGroup.push({ idx: j, dataIndex: fieldName, header: fieldLabel, value: v });
								   lastvalues[j] = v;
								   gvalue.push(v);
								   grpFieldNames.push(fieldName);
								   grpFieldLabels.push(fieldLabel + ': ' + v);
							       }
							       else {
								   if (lastvalues[j] != v) {
								       // This record is not in same group as previous one
								       addGroup.push({ idx: j, dataIndex: fieldName, header: fieldLabel, value: v });
								       lastvalues[j] = v;
								       changed = 1;
								       gvalue.push(v);
								       grpFieldNames.push(fieldName);
								       grpFieldLabels.push(fieldLabel + ': ' + v);
								   }
								   else {
								       if (gfLen - 1 == j && changed != 1) {
									   // This row is in all the same groups to the previous group
									   curGroup.rs.push(r);
									   member_of_groups.push(curGroup);
								       }
								       else if (changed == 1) {
									   // This group has changed because an earlier group changed.
									   addGroup.push({ idx: j, dataIndex: fieldName, header: fieldLabel, value: v });
									   gvalue.push(v);
									   grpFieldNames.push(fieldName);
									   grpFieldLabels.push(fieldLabel + ': ' + v);
								       }
								       else if (j < gfLen - 1) {
									   var parent_group = currGroups[fieldName];
									   // This is a parent group, and this record is part of this parent so add it
									   if (parent_group) {
									       parent_group.rs.push(r);
									       member_of_groups.push(parent_group);
									   }
								       }
								   }
							       }
							   }
							   else {
							       if (this.displayEmptyFields) {
								   addGroup.push({ idx: j, dataIndex: fieldName, header: fieldLabel, value: this.emptyGroupText || '' });
								   grpFieldNames.push(fieldName);
								   grpFieldLabels.push(fieldLabel + ': ');
							       }
							   }
						       } // end of "for j"
						       // build current group record
						       for (var k = 0; k < addGroup.length; k++) {
							   var gp = addGroup[k];
							   // if (gp.value != '') {
							   g = gp.dataIndex;
							   var glbl = addGroup[k].header;
							   N = this.cm.findColumnIndex(g);
							   var F = this.cm.config[N];
							   var B = F.groupRenderer || F.renderer;
							   var S = this.showGroupName ? (F.groupName || F.header) + ": " : "";
							   V = this.getGroup(gp.value, r, B, i, N, ds);
							   gid = gidPrefix + '-gp-' + gp.dataIndex + '-' +
							       Ext.util.Format.htmlEncode(gp.value);
							   // if state is defined use it, however state is in terms of expanded
							   // so negate it, otherwise use the default.
							   var isCollapsed = typeof this.state[gid] !== 'undefined' ?
							       !this.state[gid] : this.startCollapsed;
							   var gcls = isCollapsed ? 'x-grid-group-collapsed' : '';
							   curGroup = {
							       group: gp.dataIndex,
							       gvalue: V,
							       text: gp.header,
							       groupId: gid,
							       group_level: gp.idx,
							       startRow: rowIndex,
							       rs: [r],
							       cls: gcls,
							       style: gstyle + 'padding-left:' + (gp.idx * 12) + 'px;'
							   };
							   currGroups[gp.dataIndex] = curGroup;
							   groups.push(curGroup);
							   r._groupId = gid; // Associate this row to a group
							   member_of_groups.push(curGroup);
							   if (typeof this.groups == "undefined")
							       this.groups = new Array();
							   this.groups.push(curGroup);
							   // }
							   // else {
							   // gp = addGroup[k-1];
							   // gid = gidPrefix + '-gp-' + gp.dataIndex + '-' +
							   // Ext.util.Format.htmlEncode(gp.value);
							   // r._groupId = gid;
							   // }
						       } // end of "for k"
						   } // end of "for i"
						   var buf = [];
						   var parents_queued = [];
						   var queue_count = 0;
						   for (var ilen = 0, len = groups.length; ilen < len; ilen++) {
						       var g = groups[ilen];
						       // if (g.gvalue == '') {
						       // groups.pop();
						       // }
						       var next_group = groups[ilen + 1];
						       var cur_level = g.group_level;
						       var next_level = next_group == null ? -1 : next_group.group_level;
						       var leaf = g.group == groupField[gfLen - 1]
						       this.doGroupStart(buf, g, cs, ds, colCount);
						       if (g.rs.length != 0 && leaf) {
							   buf[buf.length] = Ext.grid.GroupingView.superclass.doRender.call(
							       this, cs, g.rs, ds, g.startRow, colCount, stripe);
						       }
						       if (leaf) {
							   // do summaries on all grouping levels for this group
							   this.doGroupEnd(buf, g, cs, ds, colCount);
						       }
						       else
							   parents_queued.push(g);
						       if (next_level >= cur_level)
							   continue;
						       // going back from leaf - pop parents from queue
						       // and call doGroupEnd for each
						       while (cur_level > next_level && cur_level > 0) {
							   g = parents_queued.pop();
							   this.doGroupEnd(buf, g, cs, ds, colCount);
							   cur_level--;
						       }
						   }
						   return buf.join('');
					       },
					       getGroup: function(A, D, F, G, B, E) {
						   var C = F ? F(A, {}, D, G, B, E) : String(A);
						   if (C === "")
						       C = this.cm.config[B].emptyGroupText || this.emptyGroupText;
						   return C;
					       },
					       /** Should return an array of all elements that represent a row, it should bypass
						* all grouping sections
						*/
					       getRows: function() {
						   if (!this.enableGrouping)
						       return Ext.grid.GroupingView.superclass.getRows.call(this);
						   return Ext.DomQuery.select("div.x-grid3-row", this.mainBody.dom);
					       },
					       getGroupById: function(gid) {
						   var g = null;
						   for (var i = 0; i < this.groups.length; i++) {
						       group = this.groups[i];
						       if (group.groupId == gid)
							   return group;
						   }
						   return g;
					       }
					   });
Ext.ux.grid.MultiGroupingPanelEditor = function(config) {
    config = config || {};
    config.tbar = new Ext.Toolbar({ id: 'grid-tbr' });
    Ext.ux.grid.MultiGroupingPanelEditor.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.grid.MultiGroupingPanelEditor, Ext.grid.GridPanel, {
	       isEditor: true,
	       detectEdit: false,
	       autoEncode: false,
	       trackMouseOver: false,
	       initComponent: function() {
		   Ext.ux.grid.MultiGroupingPanelEditor.superclass.initComponent.call(this);
		   if (!this.selModel) {
		       this.selModel = new Ext.grid.CellSelectionModel()
		   }
		   this.activeEditor = null;
		   this.addEvents("beforeedit", "afteredit", "validateedit")
	       }
	       , initEvents: function() {
		   Ext.ux.grid.MultiGroupingPanelEditor.superclass.initEvents.call(this);
		   this.on("bodyscroll", this.stopEditing, this, [true]);
		   if (this.clicksToEdit == 1) {
		       this.on("cellclick", this.onCellDblClick, this)
		   }
		   else {
		       if (this.clicksToEdit == "auto" && this.view.mainBody) { this.view.mainBody.on("mousedown", this.onAutoEditClick, this) }
		       this.on("celldblclick", this.onCellDblClick, this)
		   } this.getGridEl().addClass("xedit-grid")
	       }
	       , onCellDblClick: function(B, C, A) { this.startEditing(C, A) }
	       , onAutoEditClick: function(C, B) {
		   if (C.button !== 0) { return }
		   var E = this.view.findRowIndex(B);
		   var A = this.view.findCellIndex(B);
		   if (E !== false && A !== false) {
		       this.stopEditing();
		       if (this.selModel.getSelectedCell) {
			   var D = this.selModel.getSelectedCell();
			   if (D && D.cell[0] === E && D.cell[1] === A) { this.startEditing(E, A) }
		       }
		       else { if (this.selModel.isSelected(E)) { this.startEditing(E, A) } }
		   }
	       }
	       , onEditComplete: function(B, D, A) {
		   this.editing = false;
		   this.activeEditor = null;
		   B.un("specialkey", this.selModel.onEditorKey, this.selModel);
		   var C = B.record;
		   var F = this.colModel.getDataIndex(B.col);
		   D = this.postEditValue(D, A, C, F);
		   if (String(D) !== String(A)) {
		       var E = {
			   grid: this,
			   record: C,
			   field: F,
			   originalValue: A,
			   value: D,
			   row: B.row,
			   column: B.col,
			   cancel: false
		       };
		       if (this.fireEvent("validateedit", E) !== false && !E.cancel) {
			   C.set(F, E.value);
			   delete E.cancel;
			   this.fireEvent("afteredit", E);
		       }
		   }
		   this.view.focusCell(B.row, B.col)
	       }
	       , startEditing: function(F, B) {
		   this.stopEditing();
		   if (this.colModel.isCellEditable(B, F)) {
		       this.view.ensureVisible(F, B, true);
		       var C = this.store.getAt(F);
		       var E = this.colModel.getDataIndex(B);
		       var D = {
			   grid: this,
			   record: C,
			   field: E,
			   value: C.data[E],
			   row: F,
			   column: B,
			   cancel: false
		       };
		       if (this.fireEvent("beforeedit", D) !== false && !D.cancel) {
			   this.editing = true;
			   var A = this.colModel.getCellEditor(B, F);
			   if (!A.rendered)
			       A.render(this.view.getEditorParent(A));
			   (function() {
				A.row = F;
				A.col = B;
				A.record = C;
				A.on("complete", this.onEditComplete, this, { single: true });
				A.on("specialkey", this.selModel.onEditorKey, this.selModel);
				this.activeEditor = A;
				var G = this.preEditValue(C, E);
				A.startEdit(this.view.getCell(F, B), G);
			    }).defer(50, this);
		       }
		   }
	       }
	       , preEditValue: function(A, B) { return this.autoEncode && typeof value == "string" ? Ext.util.Format.htmlDecode(A.data[B]) : A.data[B] }
	       , postEditValue: function(C, A, B, D) { return this.autoEncode && typeof C == "string" ? Ext.util.Format.htmlEncode(C) : C }
	       , stopEditing: function(A) { if (this.activeEditor) { this.activeEditor[A === true ? "cancelEdit" : "completeEdit"]() } this.activeEditor = null }
	       , setUpDragging: function() {
		   this.dragZone = new Ext.dd.DragZone(this.getTopToolbar().getEl(), {
							   ddGroup: "grid-body"
							   , panel: this
							   , scroll: false
							   , onInitDrag: function(e) {
							       var clone = this.dragData.ddel;
							       clone.id = Ext.id('ven');
							       this.proxy.update(clone);
							       return true;
							   }
							   , getDragData: function(e) {
							       var target = Ext.get(e.getTarget().id);
							       if (target.hasClass('x-toolbar x-small-editor')) { return false; }
							       d = e.getTarget().cloneNode(true);
							       d.id = Ext.id();
							       this.dragData = {
								   repairXY: Ext.fly(target).getXY(),
								   ddel: d,
								   btn: e.getTarget()
							       };
							       return this.dragData;
							   }
							   , getRepairXY: function() { return this.dragData.repairXY; }
						       });
		   this.dropTarget2s = new Ext.dd.DropTarget('grid-tbr', {
								 ddGroup: "gridHeader" + this.getGridEl().id
								 , panel: this
								 , notifyDrop: function(dd, e, data) {
								     var btname = this.panel.getColumnModel().getDataIndex(this.panel.getView().getCellIndex(data.header));
								     this.panel.store.groupBy(btname);
								     return true;
								 }
							     });
		   this.dropTarget22s = new Ext.dd.DropTarget(this.getView().el.dom.childNodes[0].childNodes[1], {
								  ddGroup: "grid-body"
								  , panel: this
								  , notifyDrop: function(dd, e, data) {
								      var txt = Ext.get(data.btn).dom.innerHTML;
								      var tb = this.panel.getTopToolbar();
								      var bidx = tb.items.findIndexBy(function(b) {
													  return b.text == txt;
												      }, this);
								      if (bidx < 0) return false;
								      var fld = tb.items.get(bidx).fieldName;
								      Ext.removeNode(Ext.getDom(tb.items.get(bidx).id));
								      if (bidx > 0) Ext.removeNode(Ext.getDom(tb.items.get(bidx - 1).id)); ;
								      var cidx = this.panel.view.cm.findColumnIndex(fld);
								      if (cidx < 0) { }
								      this.panel.view.cm.setHidden(cidx, false);
								      var temp = [];
								      for (var i = this.panel.store.groupField.length - 1; i >= 0; i--) {
									  if (this.panel.store.groupField[i] == fld) {
									      this.panel.store.groupField.pop();
									      break;
									  }
									  temp.push(this.panel.store.groupField[i]);
									  this.panel.store.groupField.pop();
								      }
								      for (var i = temp.length - 1; i >= 0; i--) { this.panel.store.groupField.push(temp[i]); }
								      if (this.panel.store.groupField.length == 0) { this.panel.store.groupField = false; }
								      this.panel.store.fireEvent('datachanged', this);
								      return true;
								  }
							      });
	       }
	   });
Ext.reg("editorgrid", Ext.ux.grid.MultiGroupingPanelEditor);
//Ext.ux.grid.MultiGroupingPanel = function(config) {
// config = config || {};
// config.tbar = new Ext.Toolbar({ id: 'grid-tbr' });
// Ext.ux.grid.MultiGroupingPanel.superclass.constructor.call(this, config);
//};
//Ext.extend(Ext.ux.grid.MultiGroupingPanel, Ext.grid.GridPanel, {
// initComponent: function() {
// Ext.ux.grid.MultiGroupingPanel.superclass.initComponent.call(this);
// this.on("render", this.setUpDragging, this);
// }
// , setUpDragging: function() {
// this.dragZone = new Ext.dd.DragZone(this.getTopToolbar().getEl(), {
// ddGroup: "grid-body"
// , panel: this
// , scroll: false
// , onInitDrag: function(e) {
// var clone = this.dragData.ddel;
// clone.id = Ext.id('ven');
// this.proxy.update(clone);
// return true;
// }
// , getDragData: function(e) {
// var target = Ext.get(e.getTarget().id);
// if (target.hasClass('x-toolbar x-small-editor')) {
// return false;
// }
// d = e.getTarget().cloneNode(true);
// d.id = Ext.id();
// this.dragData = {
// repairXY: Ext.fly(target).getXY(),
// ddel: d,
// btn: e.getTarget()
// };
// return this.dragData;
// }
// , getRepairXY: function() { return this.dragData.repairXY; }
// });
// this.dropTarget2s = new Ext.dd.DropTarget('grid-tbr', {
// ddGroup: "gridHeader" + this.getGridEl().id
// , panel: this
// , notifyDrop: function(dd, e, data) {
// var btname = this.panel.getColumnModel().getDataIndex(this.panel.getView().getCellIndex(data.header));
// this.panel.store.groupBy(btname);
// return true;
// }
// });
// this.dropTarget22s = new Ext.dd.DropTarget(this.getView().el.dom.childNodes[0].childNodes[1], {
// ddGroup: "grid-body"
// , panel: this
// , notifyDrop: function(dd, e, data) {
// var txt = Ext.get(data.btn).dom.innerHTML;
// var tb = this.panel.getTopToolbar();
// var bidx = tb.items.findIndexBy(function(b) {
// return b.text == txt;
// }, this);
// if (bidx < 0) return false;
// var fld = tb.items.get(bidx).fieldName;
// Ext.removeNode(Ext.getDom(tb.items.get(bidx).id));
// if (bidx > 0) Ext.removeNode(Ext.getDom(tb.items.get(bidx - 1).id)); ;
// var cidx = this.panel.view.cm.findColumnIndex(fld);
// if (cidx < 0) { }
// this.panel.view.cm.setHidden(cidx, false);
// var temp = [];
// for (var i = this.panel.store.groupField.length - 1; i >= 0; i--) {
// if (this.panel.store.groupField[i] == fld) {
// this.panel.store.groupField.pop();
// break;
// }
// temp.push(this.panel.store.groupField[i]);
// this.panel.store.groupField.pop();
// }
// for (var i = temp.length - 1; i >= 0; i--) { this.panel.store.groupField.push(temp[i]); }
// if (this.panel.store.groupField.length == 0) { this.panel.store.groupField = false; }
// this.panel.store.fireEvent('datachanged', this);
// return true;
// }
// });
// }
//});
Ext.ux.grid.MultiGroupingGrid = function(config) {
    config = config || {};
    // Cache the orignal column model, before state is applied
    if (config.cm)
	this.origColModel = Ext.ux.grid.clone(config.cm.config);
    else if (config.colModel)
    this.origColModel = Ext.ux.grid.clone(config.colModel.config);
    // config.tbar = [{
    // xtype: 'tbtext'
    // , text: this.emptyToolbarText
    // }, {
    // xtype: 'tbfill'
    // , noDelete: true
    // }, {
    // xtype: 'tbbutton'
    // , text: 'Options'
    // , noDelete: true
    // , menu: {
    // items: [{
    // text: 'Columns Reset',
    // scope: this,
    // disabled: !this.origColModel,
    // handler: function() {
    // this.getColumnModel().setConfig(this.origColModel, false);
    // this.saveState();
    // return true;
    // }
    // }, {
    // text: 'Show columns grouped'
    // , checked: !config.view.hideGroupedColumn
    // , scope: this
    // , checkHandler: function(item, checked) {
    // this.view.hideGroupedColumn = !checked;
    // this.view.refresh(true);
    // }
    // }, {
    // text: 'Clean filters' // Labels.get('label.jaffa.jaffaRIA.jaffa.finder.grid.deactivateFilters')
    // , scope: this
    // , handler: function() {
    // //@TODO use the clearFilters() method!
    // this.plugins.filters.each(function(flt) {
    // flt.setActive(false);
    // });
    // }
    //}]
    // }
    //}];
    Ext.ux.grid.MultiGroupingGrid.superclass.constructor.call(this, config);
    //console.debug("Create MultiGroupingGrid",config);
};

//Ext.extend(Ext.ux.MultiGroupingGrid, Ext.grid.GridPanel, {
//modified by jesus, extend a Ext.grid.EditorGridPanel class
Ext.extend(Ext.ux.grid.MultiGroupingGrid, Ext.grid.EditorGridPanel, {

	       initComponent: function() {
		   //console.debug("MultiGroupingGrid.initComponent",this);
		   Ext.ux.grid.MultiGroupingGrid.superclass.initComponent.call(this);
		   // Initialise DragZone
		   // this.on("render", this.setUpDragging, this);
	       }
	       /** @cfg emptyToolbarText String to display on tool bar when there are no groups
		*/
	       , emptyToolbarText: "Drag the columns to group here"
	       /** Extend basic version so the Grouping Columns State is remebered
		*/
	       , getState: function() {
		   var s = Ext.ux.grid.MultiGroupingGrid.superclass.getState.call(this);
		   s.groupFields = this.store.getGroupState();
		   return s;
	       }
	       /** Extend basic version so the Grouping Columns State is applied
		*/
	       , applyState: function(state) {
		   Ext.ux.grid.MultiGroupingGrid.superclass.applyState.call(this, state);
		   if (state.groupFields) {
		       this.store.groupBy(state.groupFields, true);
		       if (typeof console != "undefined")
			   console.debug("Grid.applyState: Groups=", state.groupFields);
		   }
	       }
	       // , setUpDragging: function() {
	       // //console.debug("SetUpDragging", this);
	       // this.dragZone = new Ext.dd.DragZone(this.getTopToolbar().getEl(), {
	       // ddGroup: "grid-body" + this.getGridEl().id //FIXME - does this need to be unique to support multiple independant panels on the same page
	       // , panel: this
	       // , scroll: false
	       // // @todo - docs
	       // , onInitDrag: function(e) {
	       // // alert('init');
	       // var clone = this.dragData.ddel;
	       // clone.id = Ext.id('ven'); //FIXME??
	       // // clone.class='x-btn button';
	       // this.proxy.update(clone);
	       // return true;
	       // }
	       // // @todo - docs
	       // , getDragData: function(e) {
	       // var target = Ext.get(e.getTarget().id);
	       // //console.debug("DragZone: ",e,target);
	       // if (!target || target.hasClass('x-toolbar x-small-editor')) {
	       // return false;
	       // }
	       // d = e.getTarget().cloneNode(true);
	       // d.id = Ext.id();
	       // if (typeof console != "undefined")
	       // console.debug("getDragData", this, target);
	       // this.dragData = {
	       // repairXY: Ext.fly(target).getXY(),
	       // ddel: d,
	       // btn: e.getTarget()
	       // };
	       // return this.dragData;
	       // }
	       // //Provide coordinates for the proxy to slide back to on failed drag.
	       // //This is the original XY coordinates of the draggable element.
	       // , getRepairXY: function() {
	       // return this.dragData.repairXY;
	       // }
	       // });
	       // // This is the target when columns are dropped onto the toolbar (ie added to the group)
	       // this.dropTarget2s = new Ext.dd.DropTarget(this.getTopToolbar().getEl(), {
	       // ddGroup: "gridHeader" + this.getGridEl().id
	       // , panel: this
	       // , notifyDrop: function(dd, e, data) {
	       // if (this.panel.getColumnModel().config[this.panel.getView().getCellIndex(data.header)].groupable) {
	       // if (typeof console != "undefined")
	       // console.debug("Adding Filter", data);
	       // var btname = this.panel.getColumnModel().getDataIndex(this.panel.getView().getCellIndex(data.header));
	       // this.panel.store.groupBy(btname);
	       // return true;
	       // }
	       // else {
	       // return false;
	       // }
	       // }
	       // , notifyOver: function(dd, e, data) {
	       // if (this.panel.getColumnModel().config[this.panel.getView().getCellIndex(data.header)].groupable) {
	       // return this.dropAllowed;
	       // }
	       // else {
	       // return this.dropNotAllowed;
	       // }
	       // }
	       // });
	       // // This is the target when columns are dropped onto the grid (ie removed from the group)
	       // this.dropTarget22s = new Ext.dd.DropTarget(this.getView().el.dom.childNodes[0].childNodes[1], {
	       // ddGroup: "grid-body" + this.getGridEl().id //FIXME - does this need to be unique to support multiple independant panels on the same page
	       // , panel: this
	       // , notifyDrop: function(dd, e, data) {
	       // var txt = Ext.get(data.btn).dom.innerHTML;
	       // var tb = this.panel.getTopToolbar();
	       // if (typeof console != "undefined")
	       // console.debug("Removing Filter", txt);
	       // var bidx = tb.items.findIndexBy(function(b) {
	       // if (typeof console != "undefined")
	       // console.debug("Match button ", b.text);
	       // return b.text == txt;
	       // }, this);
	       // if (typeof console != "undefined")
	       // console.debug("Found matching button", bidx);
	       // if (bidx < 0) return false; // Error!
	       // var fld = tb.items.get(bidx).fieldName;
	       // // Remove from toolbar
	       // Ext.removeNode(Ext.getDom(tb.items.get(bidx).id));
	       // if (bidx > 0) Ext.removeNode(Ext.getDom(tb.items.get(bidx - 1).id)); ;
	       // if (typeof console != "undefined")
	       // console.debug("Remove button", fld);
	       // //console.dir(button);
	       // var cidx = this.panel.view.cm.findColumnIndex(fld);
	       // if (cidx < 0)
	       // console.error("Can't find column for field ", fld);
	       // this.panel.view.cm.setHidden(cidx, false);
	       // //Ext.removeNode(Ext.getDom(data.btn.id));
	       // // Remove this group from the groupField array
	       // // @todo - replace with method on store
	       // // this.panel.store.removeGroupField(fld);
	       // var temp = [];
	       // for (var i = this.panel.store.groupField.length - 1; i >= 0; i--) {
	       // if (this.panel.store.groupField[i] == fld) {
	       // this.panel.store.groupField.pop();
	       // break;
	       // }
	       // temp.push(this.panel.store.groupField[i]);
	       // this.panel.store.groupField.pop();
	       // }
	       // for (var i = temp.length - 1; i >= 0; i--) {
	       // this.panel.store.groupField.push(temp[i]);
	       // }
	       // if (this.panel.store.groupField.length == 0)
	       // this.panel.store.groupField = false;
	       // this.panel.store.fireEvent('datachanged', this);
	       // return true;
	       // }
	       // });
	       // }
	       , buildFilters: function(columns, record) {
		   //console.debug("Grid.buildFilters: Created Filters from ", columns, record);
		   var config = [];
		   for (var i = 0; i < columns.length; i++) {
		       var col = columns[i];
		       var meta = record.getField(col.dataIndex);
		       //console.debug("Meta Data For ", col.dataIndex, meta)
		       if (meta && (meta.filter || meta.filterFieldName)) {
			   var dt = meta.dataType || 'string';
			   if (dt == 'int' || dt == 'long' || dt == 'float' || dt == 'double')
			       dt == 'numeric';
			   else if (dt == 'dateonly' || dt == 'datetime')
			   dt = 'date';
			   //FIXME pass caseType on this filter definition, so it can be applied to the filter field 
			   var f = { dataIndex: col.dataIndex, type: dt, paramName: col.filterFieldName };
			   config[config.length] = f;
		       }
		   }
		   if (typeof console != "undefined")
		       console.debug("Grid.buildFilters: Created Filters for ", config);
		   if (config.length == 0)
		       return null;
		   else
		       return new Ext.ux.grid.GridFilters({ filters: config, local: false });
	       }
	       , buildColumnModel: function(columns, record) {
		   var config = [];
		   for (var i = 0; i < columns.length; i++) {
		       var col = columns[i];
		       var meta = record.getField(col.dataIndex);
		       var cm = Ext.apply({}, col);
		       if (meta) {
			   // Apply stuff from the Record's Meta Data
			   if (!cm.hidden && meta.hidden == true) cm.hidden = true;
			   if (!cm.header && meta.label) cm.header = meta.label;
			   if (!cm.renderer && meta.renderer) cm.renderer = meta.renderer;
			   cm.sortable = (meta.sortable === true || (meta.sortFieldName && meta.sortFieldName != ''));
			   // Apply more metadata from associated ClassMetaData
			   var mc = meta.metaClass || record.defaultMetaClass;
			   var mfn = (meta.mapping || col.dataIndex).match(/.*\b(\w+)$/)[1];
			   var mf = ClassMetaData[mc] ? ClassMetaData[mc].fields[mfn] : undefined;
			   if (!mf) mf = ClassMetaData[mc] ? ClassMetaData[mc].fields[col.dataIndex] : undefined;
			   if (typeof console != "undefined")
			       console.debug("Meta Class=", mc, ClassMetaData[mc], ', dataIndex=', col.dataIndex, ', mapping=', meta.mapping, ', mfn=', mfn, ', mf=', mf, ', meta=', meta);
			   if (mf) {
			       // Default the header text
			       if (!cm.header && mf.label) cm.header = mf.label;
			       // Default the column width
			       if (!cm.width) {
				   if (mf.maxLength) cm.width = Math.min(Math.max(mf.maxLength, 5), 40) * 8;
				   else if (mf.type) {
				       if (mf.type == 'dateonly') cm.width = 100;
				       else if (mf.type == 'datetime') cm.width = 140;
				       else if (mf.type == 'boolean') cm.width = 50;
				   }
			       }
			       // Default the alignment
			       if (!cm.align && mf.type && (mf.type == 'float' || mf.type == 'int'))
				   cm.align = 'right';
			       // Default standard renderers 
			       if (!cm.renderer && mf.type) {
				   if (mf.type == 'dateonly') cm.renderer = Ext.util.Format.dateRenderer();
				   else if (mf.type == 'datetime') cm.renderer = Ext.util.Format.dateTimeRenderer();
			       }
			       if (mf.hidden == true) cm.hidden = true;
			   }
		       }
		       if (!cm.header) cm.header = col.dataIndex;
		       cm.groupable = (cm.groupable == true || cm.sortable == true);
		       config[config.length] = cm;
		       if (typeof console != "undefined")
			   console.debug("Grid.buildColumnModel: Width", cm.dataIndex, cm.width);
		   }
		   if (typeof console != "undefined")
		       console.debug("Grid.buildColumnModel: Created Columns for ", config);
		   return new Ext.grid.ColumnModel(config);
	       }
	   });
Ext.ux.grid.MultiGroupingPagingGrid = Ext.extend(Ext.ux.grid.MultiGroupingGrid, {
						     /** When creating the store, register an internal callback for post load processing
						      */
						     constructor: function(config) {
							 config = config || {};
							 config.bbar = [].concat(config.bbar);
							 config.bbar = config.bbar.concat([
											      { xtype: 'tbfill' }
											      , { xtype: 'tbtext', id: 'counter', text: '? of ?' }
											      , { xtype: 'tbspacer' }
											      , { xtype: 'tbbutton', id: 'loading', hidden: true, iconCls: "x-tbar-loading" }
											      , { xtype: 'tbseparator' }
											      , { xtype: 'tbbutton', id: 'more', text: '>>', handler: function() { this.store.loadMore(false); }, scope: this }
											  ]);
							 Ext.ux.grid.MultiGroupingPagingGrid.superclass.constructor.apply(this, arguments);
							 // Create Event that asks for more data when we scroll to the end
							 this.on("bodyscroll", function() {
								     var s = this.view.scroller.dom;
								     if ((s.offsetHeight + s.scrollTop + 5 > s.scrollHeight) && !this.isLoading) {
									 if (typeof console != "undefined")
									     console.debug("Grid.on.bodyscroll: Get more...");
									 this.store.loadMore(false);
								     }
								 }, this);
							 // When the grid start loading, display a loading icon 
							 this.store.on("beforeload", function(store, o) {
									   if (this.isLoading) {
									       if (typeof console != "undefined")
										   console.debug("Store.on.beforeload: Reject Load, one is in progress");
									       return false;
									   }
									   this.isLoading = true;
									   if (this.rendered) {
									       this.barLoading.show();
									   }
									   if (typeof console != "undefined")
									       console.debug("Store.on.beforeload: options=", o, this);
									   return true;
								       }, this);
							 // When loading has finished, disable the loading icon, and update the row count 
							 this.store.on("load", function() {
									   delete this.isLoading;
									   if (this.rendered) {
									       this.barLoading.hide();
									       if (typeof console != "undefined")
										   console.debug("Store.on.load: Finished loading.. ", this.store.totalCount);
									       this.barCounter.getEl().innerHTML = "Mostrando " + this.store.getCount() + ' de ' +
										   (this.store.totalCount ? this.store.totalCount : '?');
									       if (this.store.totalCount)
										   this.barMore.disable();
									       else
										   this.barMore.enable();
									   }
									   return true;
								       }, this);
							 // When a loading error occurs, disable the loading icon and display error 
							 this.store.on("loadexception", function(store, e) {
									   if (typeof console != "undefined")
									       console.debug("Store.loadexception.Event:", arguments);
									   delete this.isLoading;
									   if (this.rendered) {
									       this.barLoading.hide();
									   }
									   if (e)
									       Ext.Msg.show({
												title: 'Show Details',
												msg: "Error cargando registros - " + e,
												buttons: Ext.Msg.OK,
												icon: Ext.MessageBox.ERROR
											    });
									   return false;
								       }, this);
							 // As the default onLoad to refocus on the first row has been disabled,
							 // This has been added so if a load does happen, and its an initial load
							 // it refocuses. If this is a refresh caused by a sort/group or a new page
							 // of data being loaded, it does not refocus 
							 this.store.on("load", function(r, o) {
									   if (o && o.initial == true)
									       Ext.ux.grid.MultiGroupingView.superclass.onLoad.call(this);
								       }, this.view);
						     }
						     // private
						     , onRender: function(ct, position) {
							 Ext.ux.griMultiGroupingPagingGrid.superclass.onRender.call(this, ct, position);
							 var bb = this.getBottomToolbar();
							 this.barCounter = bb.items.itemAt(bb.items.length - 5);
							 this.barMore = bb.items.itemAt(bb.items.length - 1);
							 this.barLoading = bb.items.itemAt(bb.items.length - 3);
						     }
						 });




var keez = Object.keys(data[0]);
var all = [];

var clms = [];
var rdr = [];
for (var j = 0; j < keez.length; j++){
    var col = {width: 100, sortable: true};
    var rd = {  };
    
    if (j == 0)
	col['id'] = keez[j];
    col['header'] = keez[j];
    col['dataIndex'] = keez[j];
    rd['name'] = keez[j];
    clms.push(col);
    rdr.push(rd);
}

for (var i = 0; i < data.length; i++){
    var one = [];
    for (var j = 0; j < keez.length; j++){
	one.push(data[i][keez[j]]);
    }
    all.push(one);
}


/*var clms = 
    [{id: 'Parameter', header: 'Parameter', width: 100, sortable: true, dataIndex: 'Parameter' }
     , { header: 'Value', width: 100, sortable: true, dataIndex: 'Value' }
     , { header: 'group1', width: 100, sortable: true, hidden: false, dataIndex: 'group1' }
     , { header: 'group2', width: 100, sortable: true, hidden: false, dataIndex: 'group2' }];
*/

Ext.grid.dummyData1 = all;
/*[
    ['Test1', 'JS1', 'Header1', 10],
    ['Test2', 'JS2', 'Header1', 2],
    ['Test3', 'JS3', 'Header1', 3],
    ['Test4', 'JS4', 'Header1', 1],
    ['Test5', 'JS5', 'Header1', 2],
    ['Test6', 'JS6', 'Header1', 10],
    ['Test1', 'JS1', 'Header3', 12]
];*/

/*var clms = [
    { id: 'Parameter', header: 'Parameter', width: 100, sortable: true, dataIndex: 'Parameter' }
    , { header: 'Value', width: 100, sortable: true, dataIndex: 'Value' }
    , { header: 'group1', width: 100, sortable: true, hidden: false, dataIndex: 'group1' }
    , { header: 'group2', width: 100, sortable: true, hidden: false, dataIndex: 'group2' }];*/

		var reader = new Ext.data.ArrayReader({}, rdr);


Ext.onReady(function() {
		Ext.QuickTips.init();
		var xg = Ext.grid;


		var groupStore = new Ext.ux.grid.MultiGroupingStore({
									data: xg.dummyData1
									, reader: reader
									, sortInfo: null
									, groupField: []
								    });

		var groupView = new Ext.ux.grid.MultiGroupingView({
								      hideGroupedColumn: true
								      , emptyGroupText: ''
								      , displayEmptyFields: true//you can choose to show the group fields, even when they have no values
								      , groupTextTpl: '{gvalue}'//({[values.rs.length]} {[values.rs.length > 1 ? "Events" : "Event"]})'
								      // : {group} ' +
								      // '({values.rs.length} ' +
								      // 'Record{[values.rs.length>1?"s":""]}) ' +
								      // '/ Total Material Cost={[fm.usMoney(values.rs.sum("materialCosts"))]}'
								      // Templates can be set up per grouping field if required
								      // , groupFieldTemplates: {
								      // 'serial': 'Special Grouping For Serial Number {gvalue}'
								      // , 'ecd': '{text}: {[todayString==values.group?"Today":yesterdayString==values.group?"Yesterday":values.group]}'
								      // }
								  });
		groupStore.clearGrouping();
		var grid = new Ext.ux.grid.MultiGroupingGrid({
								 store: groupStore
								 , columns: clms
//								 , stateful: true
								 ,view: groupView
								 , width: 900
								 , height: 400
								 , collapsible: true
								 , animCollapse: true
								 , title: 'Grouping Example'
								 , iconCls: 'icon-grid'
								 , renderTo: document.body
/*								 , selModel: new Ext.grid.RowSelectionModel({
														listeners: {
														    scope: this
														    , 'rowselect': function(rsm, rowIndex, r) {
															console.debug("rowselect : ", rsm, rowIndex, r);
															Ext.Msg.show({
																	 title: 'Show Details',
																	 msg: 'You have selected Work Order ' + r.data.workOrderNo,
																	 buttons: Ext.Msg.OK,
																	 icon: Ext.MessageBox.INFO
																     });
														    }
														}
													    })*/
							     });
	    });


