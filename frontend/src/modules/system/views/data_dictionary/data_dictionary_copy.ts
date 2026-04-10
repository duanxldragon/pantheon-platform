import type { Language } from '../../../../stores/language_store';

export interface DataDictionaryCopy {
  entity: {
    dictionary: { zh: string; en: string };
    item: { zh: string; en: string; enPlural: string };
    type: { zh: string; en: string; enPlural: string };
  };
  pageTitle: string;
  pageDescription: string;
  actions: {
    refresh: string;
    import: string;
    export: string;
    addType: string;
    addItem: string;
    viewTypeDetail: string;
    editType: string;
    deleteType: string;
  };
  fields: {
    selectType: string;
    typeHint: string;
    searchPlaceholder: string;
    prev: string;
    next: string;
    page: string;
  };
  messages: {
    selectTypeFirst: string;
    typeRequired: string;
    itemRequired: string;
    typeFormRequired: string;
    invalidFile: string;
    itemStatusUpdated: string;
  };
  permissionLabels: {
    addItem: string;
    editItem: string;
    deleteItem: string;
    addType: string;
    editType: string;
    deleteType: string;
    export: string;
    import: string;
    enableItem: string;
    disableItem: string;
  };
  sidebar: {
    typeTitle: string;
    typeSearchPlaceholder: string;
    typeEmptyHint: string;
  };
  dialog: {
    addItemTitle: string;
    editItemTitle: string;
    addTypeTitle: string;
    editTypeTitle: string;
    save: string;
    cancel: string;
    loading: string;
    deleteTitle: string;
    delete: string;
    fields: {
      type: string;
      sort: string;
      label: string;
      value: string;
      status: string;
      remark: string;
      typeName: string;
      typeCode: string;
    };
    placeholders: {
      label: string;
      value: string;
      remark: string;
      typeName: string;
      typeCode: string;
      typeDesc: string;
    };
    statusEnabled: string;
    statusDisabled: string;
    currentType: string;
  };
  table: {
    columns: {
      label: string;
      value: string;
      style: string;
      sort: string;
      status: string;
      remark: string;
      actions: string;
    };
    actions: {
      detail: string;
      editItem: string;
      delete: string;
      edit: string;
    };
    emptyHint: string;
  };
}

const zhCopy: DataDictionaryCopy = {
  entity: {
    dictionary: { zh: '数据字典', en: 'Dictionary' },
    item: { zh: '字典项', en: 'Dictionary item', enPlural: 'dictionary items' },
    type: { zh: '字典类型', en: 'Dictionary type', enPlural: 'dictionary types' },
  },
  pageTitle: '数据字典',
  pageDescription: '维护系统字典类型和字典项，支撑菜单、状态、枚举等基础配置。',
  actions: {
    refresh: '刷新',
    import: '导入',
    export: '导出',
    addType: '新增类型',
    addItem: '新增字典项',
    viewTypeDetail: '查看类型详情',
    editType: '编辑类型',
    deleteType: '删除类型',
  },
  fields: {
    selectType: '请选择字典类型',
    typeHint: '选择左侧类型后即可管理对应字典项。',
    searchPlaceholder: '搜索字典标签、值或备注',
    prev: '上一页',
    next: '下一页',
    page: '第',
  },
  messages: {
    selectTypeFirst: '请先选择一个字典类型',
    typeRequired: '未选择字典类型',
    itemRequired: '请填写完整的字典项信息',
    typeFormRequired: '请填写完整的字典类型信息',
    invalidFile: '无效的数据字典文件格式',
    itemStatusUpdated: '字典项状态更新成功',
  },
  permissionLabels: {
    addItem: '新增字典项',
    editItem: '编辑字典项',
    deleteItem: '删除字典项',
    addType: '新增字典类型',
    editType: '编辑字典类型',
    deleteType: '删除字典类型',
    export: '导出',
    import: '导入',
    enableItem: '字典项启用',
    disableItem: '字典项禁用',
  },
  sidebar: {
    typeTitle: '字典类型',
    typeSearchPlaceholder: '搜索类型名称或编码',
    typeEmptyHint: '暂无匹配的字典类型',
  },
  dialog: {
    addItemTitle: '新增字典项',
    editItemTitle: '编辑字典项',
    addTypeTitle: '新增字典类型',
    editTypeTitle: '编辑字典类型',
    save: '保存',
    cancel: '取消',
    loading: '处理中...',
    deleteTitle: '删除',
    delete: '删除',
    fields: {
      type: '字典类型',
      sort: '排序',
      label: '标签',
      value: '值',
      status: '状态',
      remark: '备注',
      typeName: '类型名称',
      typeCode: '类型编码',
    },
    placeholders: {
      label: '请输入标签',
      value: '请输入值',
      remark: '请输入备注',
      typeName: '请输入类型名称',
      typeCode: '请输入类型编码',
      typeDesc: '请输入类型说明',
    },
    statusEnabled: '启用',
    statusDisabled: '禁用',
    currentType: '当前类型',
  },
  table: {
    columns: {
      label: '标签',
      value: '值',
      style: '样式',
      sort: '排序',
      status: '状态',
      remark: '备注',
      actions: '操作',
    },
    actions: {
      detail: '详情',
      editItem: '编辑字典项',
      delete: '删除',
      edit: '编辑',
    },
    emptyHint: '暂无字典项数据',
  },
};

const enCopy: DataDictionaryCopy = {
  entity: {
    dictionary: { zh: '数据字典', en: 'Dictionary' },
    item: { zh: '字典项', en: 'Dictionary item', enPlural: 'dictionary items' },
    type: { zh: '字典类型', en: 'Dictionary type', enPlural: 'dictionary types' },
  },
  pageTitle: 'Data Dictionary',
  pageDescription: 'Manage dictionary types and items used by menus, statuses, enums, and base configuration.',
  actions: {
    refresh: 'Refresh',
    import: 'Import',
    export: 'Export',
    addType: 'Add Type',
    addItem: 'Add Item',
    viewTypeDetail: 'View Type Detail',
    editType: 'Edit Type',
    deleteType: 'Delete Type',
  },
  fields: {
    selectType: 'Select a dictionary type',
    typeHint: 'Choose a type from the left to manage dictionary items.',
    searchPlaceholder: 'Search label, value, or remark',
    prev: 'Previous',
    next: 'Next',
    page: 'Page',
  },
  messages: {
    selectTypeFirst: 'Please select a dictionary type first',
    typeRequired: 'Dictionary type is required',
    itemRequired: 'Please complete dictionary item fields',
    typeFormRequired: 'Please complete dictionary type fields',
    invalidFile: 'Invalid data dictionary file format',
    itemStatusUpdated: 'Dictionary item status updated',
  },
  permissionLabels: {
    addItem: 'add item',
    editItem: 'edit item',
    deleteItem: 'delete item',
    addType: 'add type',
    editType: 'edit type',
    deleteType: 'delete type',
    export: 'export',
    import: 'import',
    enableItem: 'item enable',
    disableItem: 'item disable',
  },
  sidebar: {
    typeTitle: 'Dictionary Types',
    typeSearchPlaceholder: 'Search type name or code',
    typeEmptyHint: 'No matching dictionary types',
  },
  dialog: {
    addItemTitle: 'Add Dictionary Item',
    editItemTitle: 'Edit Dictionary Item',
    addTypeTitle: 'Add Dictionary Type',
    editTypeTitle: 'Edit Dictionary Type',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Processing...',
    deleteTitle: 'Delete',
    delete: 'Delete',
    fields: {
      type: 'Dictionary Type',
      sort: 'Sort',
      label: 'Label',
      value: 'Value',
      status: 'Status',
      remark: 'Remark',
      typeName: 'Type Name',
      typeCode: 'Type Code',
    },
    placeholders: {
      label: 'Enter label',
      value: 'Enter value',
      remark: 'Enter remark',
      typeName: 'Enter type name',
      typeCode: 'Enter type code',
      typeDesc: 'Enter type description',
    },
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    currentType: 'Current Type',
  },
  table: {
    columns: {
      label: 'Label',
      value: 'Value',
      style: 'Style',
      sort: 'Sort',
      status: 'Status',
      remark: 'Remark',
      actions: 'Actions',
    },
    actions: {
      detail: 'Details',
      editItem: 'Edit Dictionary Item',
      delete: 'Delete',
      edit: 'Edit',
    },
    emptyHint: 'No dictionary items yet',
  },
};

export function getDataDictionaryCopy(language: Language): DataDictionaryCopy {
  return language === 'zh' ? zhCopy : enCopy;
}

