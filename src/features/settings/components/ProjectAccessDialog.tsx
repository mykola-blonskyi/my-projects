'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { setProjectAccess } from '../actions/setProjectAccess';
import type { SelectableProject } from '../lib/queries';

interface ProjectAccessDialogProps {
  userId: string;
  userLabel: string;
  allProjects: SelectableProject[];
  initialProjectIds: string[];
}

export function ProjectAccessDialog({
  userId,
  userLabel,
  allProjects,
  initialProjectIds,
}: ProjectAccessDialogProps) {
  const t = useTranslations('SettingsAccessPage');
  const tCommon = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialProjectIds));
  const [isSaving, setIsSaving] = useState(false);

  function toggleProject(projectId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedIds(new Set(initialProjectIds));
    }
    setOpen(nextOpen);
  }

  async function handleSave() {
    setIsSaving(true);
    await setProjectAccess(userId, Array.from(selectedIds));
    setIsSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t('editAccess')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userLabel}</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder={t('searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('noResults')}</CommandEmpty>
            <CommandGroup>
              {allProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => toggleProject(project.id)}
                  className="gap-2"
                >
                  <Checkbox checked={selectedIds.has(project.id)} />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
