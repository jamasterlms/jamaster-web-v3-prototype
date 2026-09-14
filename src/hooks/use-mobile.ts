import { useEffect, useState } from 'react';
export function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width:767px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width:767px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(any-pointer:coarse)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(any-pointer:coarse)');
    const update = () => setCoarse(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return coarse;
}

export function useToolsDrawer() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width:1199px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width:1199px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return compact;
}
