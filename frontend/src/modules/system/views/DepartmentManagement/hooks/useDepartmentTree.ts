import { useMemo, useState } from 'react';
import { Department } from '../../../types';

export interface DepartmentNode extends Department {
  children?: DepartmentNode[];
  level: number;
}

export function useDepartmentTree(departments: Department[]) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 1. 将平铺数据转换为树形结构
  const treeData = useMemo(() => {
    const map = new Map<string, DepartmentNode>();
    const roots: DepartmentNode[] = [];

    // 初始化所有节点
    departments.forEach((dept) => {
      map.set(dept.id, { ...dept, children: [], level: 0 });
    });

    // 建立父子关系
    departments.forEach((dept) => {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        const parent = map.get(dept.parentId)!;
        node.level = parent.level + 1;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [departments]);

  // 2. 将树形结构展平为带层级的显示序列（仅包含已展开的节点）
  const flattenedDisplayData = useMemo(() => {
    const result: DepartmentNode[] = [];
    
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((node) => {
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
    setExpandedKeys(new Set(departments.map(d => d.id)));
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
