import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export function useRealtimeRefresh(channelName, tables, onChange, enabled = true) {
  const onChangeRef = useRef(onChange);
  const tableKey = tables
    .map((tableConfig) => `${tableConfig.schema ?? 'public'}:${tableConfig.table}:${tableConfig.event ?? '*'}`)
    .join('|');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled || !tables.length) {
      return undefined;
    }

    const channel = supabase.channel(channelName);

    tables.forEach((tableConfig) => {
      channel.on(
        'postgres_changes',
        {
          event: tableConfig.event ?? '*',
          schema: tableConfig.schema ?? 'public',
          table: tableConfig.table,
        },
        () => {
          void onChangeRef.current?.();
        },
      );
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, enabled, tableKey]);
}