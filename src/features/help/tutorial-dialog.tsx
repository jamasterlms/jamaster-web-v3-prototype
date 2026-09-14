import { useRef, useState, type RefObject } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { CirclePlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { helpRole, tutorialAsset, tutorialFor, type Tutorial } from './help-model';

export function TutorialDialog({
  tutorial,
  open,
  onOpenChange,
  restoreFocusTo,
}: {
  tutorial: Tutorial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restoreFocusTo?: RefObject<HTMLButtonElement | null>;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) video.current?.pause();
        setFailed(false);
        onOpenChange(value);
      }}
    >
      <DialogContent
        className="jam-modal tutorial-dialog"
        onCloseAutoFocus={(event) => {
          if (restoreFocusTo?.current?.isConnected) {
            event.preventDefault();
            restoreFocusTo.current.focus({ preventScroll: true });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{tutorial.title}</DialogTitle>
          <DialogDescription>
            24 saniyelik Türkçe rehber · Videoyu başlatın veya adımları okuyun.
          </DialogDescription>
        </DialogHeader>
        <div className="tutorial-body">
          {open && (
            <video
              ref={video}
              key={tutorial.id}
              controls
              playsInline
              preload="none"
              poster={tutorialAsset(tutorial.id, 'webp')}
              onError={() => setFailed(true)}
              aria-label={tutorial.title}
            >
              <source src={tutorialAsset(tutorial.id, 'mp4')} type="video/mp4" />
              <track
                kind="captions"
                src={tutorialAsset(tutorial.id, 'vtt')}
                srcLang="tr"
                label="Türkçe"
                default
              />
              Tarayıcınız video oynatmayı desteklemiyor. Aşağıdaki adımları okuyabilirsiniz.
            </video>
          )}
          {failed && (
            <p role="alert">
              Video yüklenemedi. Yazılı adımlarla devam edebilirsiniz.{' '}
              <Button
                variant="ghost"
                onClick={() => {
                  setFailed(false);
                  video.current?.load();
                }}
              >
                Tekrar dene
              </Button>
            </p>
          )}
          <ol className="tutorial-steps">
            {tutorial.steps.map((step, index) => (
              <li key={step.title}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (video.current) {
                      video.current.currentTime = index * 8;
                      void video.current.play().catch(() => setFailed(true));
                    }
                  }}
                  aria-label={`${index + 1}. adımı videoda aç`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step.title}</strong>
                </Button>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function RoutedPageHelp({ title }: { title: string }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const role = helpRole(location.pathname, new URLSearchParams(location.search).get('role'));
  const tutorial = tutorialFor(location.pathname + location.search, role);
  return (
    <>
      <Button
        ref={opener}
        type="button"
        variant="ghost"
        size="icon"
        className="page-help-button"
        aria-label={`${title} kullanım videosu`}
        title="Nasıl kullanılır?"
        onClick={() => setOpen(true)}
      >
        <CirclePlay size={19} />
      </Button>
      <TutorialDialog
        restoreFocusTo={opener}
        tutorial={tutorial}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
export function PageHelpButton({ title }: { title: string }) {
  const routed = useInRouterContext();
  return routed ? <RoutedPageHelp title={title} /> : null;
}
