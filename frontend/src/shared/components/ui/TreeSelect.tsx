import { useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

export type TreeNodeValue = string | number;

interface TreeNode {
  id: TreeNodeValue;
  name: string;
  parentId: TreeNodeValue | null;
  children?: TreeNode[];
}

interface TreeSelectProps {
  data: TreeNode[];
  value: TreeNodeValue | null;
  onChange: (value: TreeNodeValue | null) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export function TreeSelect({
  data,
  value,
  onChange,
  placeholder = '请选择',
  allowClear = true,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<TreeNodeValue>>(new Set());

  const findNodeById = (nodes: TreeNode[], id: TreeNodeValue): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const selectedNode = value !== null && value !== undefined ? findNodeById(data, value) : null;

  const toggleExpand = (id: TreeNodeValue) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTree = (nodes: TreeNode[], level = 0): ReactNode =>
    nodes.map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const isExpanded = expandedKeys.has(node.id);
      const isSelected = value === node.id;

      return (
        <div key={String(node.id)}>
          <div
            className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-50 ${
              isSelected ? 'bg-blue-50 text-blue-600' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => {
              onChange(node.id);
              setOpen(false);
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="rounded p-0.5 hover:bg-gray-200"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}

            {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            <span className="flex-1 text-sm">{node.name}</span>
          </div>

          {hasChildren && isExpanded && renderTree(node.children || [], level + 1)}
        </div>
      );
    });

  const buildTree = (nodes: TreeNode[]): TreeNode[] => {
    if (!nodes || !Array.isArray(nodes)) {
      return [];
    }

    const nodeMap = new Map<TreeNodeValue, TreeNode>();
    const rootNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach((node) => {
      const current = nodeMap.get(node.id);
      if (!current) {
        return;
      }

      if (node.parentId === null || node.parentId === undefined || node.parentId === '') {
        rootNodes.push(current);
        return;
      }

      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(current);
      } else {
        rootNodes.push(current);
      }
    });

    return rootNodes;
  };

  const treeData = buildTree(data);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between bg-white hover:bg-gray-50"
        >
          <span className="truncate">{selectedNode ? selectedNode.name : placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-2" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {allowClear && value !== null && value !== undefined && value !== '' ? (
            <div
              className="cursor-pointer rounded px-2 py-2 text-sm text-gray-500 hover:bg-gray-50"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              清除选择
            </div>
          ) : null}
          {renderTree(treeData)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
