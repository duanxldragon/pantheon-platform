import { useMemo, useState } from 'react';
import { Menu } from '../../../types';

export interface MenuNode extends Menu {
  children?: MenuNode[];
  level: number;
}

export function useMenuTree(menus: Menu[]) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 1. 将平铺数据转换为树形结构
  const treeData = useMemo(() => {
    const map = new Map<string, MenuNode>();
    const roots: MenuNode[] = [];

    // 初始化所有节点
    menus.forEach((menu) => {
      map.set(menu.id, { ...menu, children: [], level: 0 });
    });

    // 建立父子关系
    menus.forEach((menu) => {
      const node = map.get(menu.id)!;
      if (menu.parentId && map.has(menu.parentId)) {
        const parent = map.get(menu.parentId)!;
        node.level = parent.level + 1;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [menus]);

  // 2. 将树形结构展平为带层级的显示序列（仅包含已展开的节点）
  const flattenedDisplayData = useMemo(() => {
    const result: MenuNode[] = [];
    
    const traverse = (nodes: MenuNode[]) => {
      // 按照 sort 字段排序
      const sortedNodes = [...nodes].sort((a, b) => (a.sort || 0) - (b.sort || 0));
      
      sortedNodes.forEach((node) => {
        result.push(node);
        if (expandedKeys.has(node.id) && node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(treeData);
    return result;
  }, [treeData, expandedKeys]);

  const toggleExpand = (id: string) => {
    const newKeys = new Set(expandedKeys);
    if (newKeys.has(id)) {
      newKeys.delete(id);
    } else {
      newKeys.add(id);
    }
    setExpandedKeys(newKeys);
  };

  const expandAll = () => {
    setExpandedKeys(new Set(menus.map(m => m.id)));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  return {
    treeData,
    flattenedDisplayData,
    expandedKeys,
    toggleExpand,
    expandAll,
    collapseAll,
  };
}


