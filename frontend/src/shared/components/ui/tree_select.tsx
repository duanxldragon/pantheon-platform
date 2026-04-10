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
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all ${
              isSelected
                ? 'border-blue-200 bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100/60'
                : 'border-transparent bg-transparent hover:border-slate-200/70 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
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
                className="rounded-xl p-1 text-slate-500 transition-colors hover:bg-slate-100"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <div
              className={`flex h-8 w-8 items-center justify-center rounded-2xl border ${
                isSelected
                  ? 'border-blue-100 bg-white/90 text-blue-600'
                  : 'border-slate-200/70 bg-white/90 text-slate-500'
              }`}
            >
              {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </div>
            <span className="flex-1 text-sm font-medium">{node.name}</span>
          </div>

          {hasChildren && isExpanded ? renderTree(node.children || [], level + 1) : null}
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
          className="h-11 w-full justify-between rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/50 transition-all hover:bg-white"
        >
          <span className={`truncate ${selectedNode ? 'text-slate-700' : 'text-slate-400'}`}>
            {selectedNode ? selectedNode.name : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] rounded-[24px] border border-slate-200/80 bg-white/98 p-3 shadow-xl shadow-slate-200/70" align="start">
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {allowClear && value !== null && value !== undefined && value !== '' ? (
            <div
              className="cursor-pointer rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
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
