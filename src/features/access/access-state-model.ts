export type AccessRole = 'student' | 'teacher' | 'user';
export function accessRole(value: string | null): AccessRole {
  return value === 'teacher' || value === 'user' ? value : 'student';
}
export const accessRoleLabels: Record<AccessRole, string> = {
  student: 'Öğrenci',
  teacher: 'Öğretmen',
  user: 'Personel',
};
export function roleHome(role: AccessRole) {
  return role === 'user' ? '/branch-selection' : `/${role}/dashboard`;
}
/** A return destination can never change origin or move a portal user into an administrative area. */
export function safeReturnTo(value: string | null, role: AccessRole) {
  if (
    !value ||
    !value.startsWith('/') ||
    /[\\%\u0000-\u0020]/.test(value) ||
    value.startsWith('//')
  )
    return roleHome(role);
  const pathname = value.split(/[?#]/)[0];
  if (pathname.split('/').some((segment) => segment === '.' || segment === '..'))
    return roleHome(role);
  const roots = role === 'user' ? ['/admin/', '/user/', '/branch-selection'] : [`/${role}/`];
  return roots.some((root) => (root.endsWith('/') ? pathname.startsWith(root) : pathname === root))
    ? value
    : roleHome(role);
}
export const accessStates = {
  unauthorized: {
    title: 'Giriş yapmanız gerekiyor',
    description: 'Bu sayfayı açmak için hesabınıza giriş yapın.',
    icon: 'lock-keyhole',
    action: 'login',
  },
  forbidden: {
    title: 'Bu alana erişiminiz yok',
    description:
      'Hesabınız bu işlemi yapmaya yetkili değil. Erişim ihtiyacınızı kurum yöneticinizle paylaşabilirsiniz.',
    icon: 'shield-check',
    action: 'home',
  },
  'session-expired': {
    title: 'Oturumunuz sona erdi',
    description: 'Güvenli şekilde devam etmek için tekrar giriş yapın.',
    icon: 'clock',
    action: 'login',
  },
  'wrong-role': {
    title: 'Farklı bir hesap türü gerekli',
    description:
      'Seçtiğiniz alan bu hesap türüne ait değil. Kendi çalışma alanınıza dönün veya doğru hesapla giriş yapın.',
    icon: 'users',
    action: 'login',
  },
  unverified: {
    title: 'E-posta doğrulaması gerekli',
    description:
      'Kurumunuzun gönderdiği doğrulama bağlantısını açın. Bağlantıya ulaşamıyorsanız kurumunuzdan yeni bağlantı isteyin.',
    icon: 'mail-check',
    action: 'help',
  },
  inactive: {
    title: 'Hesabınız aktif değil',
    description:
      'Hesabınızın durumunu kurumunuzla görüşün. Bu ekranda hesabınızı kendiniz etkinleştiremezsiniz.',
    icon: 'user-round',
    action: 'help',
  },
  pending: {
    title: 'Hesabınız onay bekliyor',
    description:
      'Kurum yöneticisi hesabınızı onayladıktan sonra çalışma alanınızı kullanabilirsiniz.',
    icon: 'clock',
    action: 'help',
  },
  'no-course': {
    title: 'Henüz ders ataması yok',
    description:
      'Size atanmış bir eğitim veya grup bulunmuyor. Atamanızı kurumunuzla kontrol edin.',
    icon: 'book-open',
    action: 'home',
  },
  suspended: {
    title: 'Kurum erişimi duraklatıldı',
    description:
      'Kurum hesabının yeniden açılması için yöneticinizin hesap durumunu kontrol etmesi gerekiyor.',
    icon: 'lock-keyhole',
    action: 'billing',
  },
  expired: {
    title: 'Kurum erişim süresi doldu',
    description: 'Erişim süresinin yenilenmesi için kurum yöneticinizle iletişime geçin.',
    icon: 'calendar-clock',
    action: 'billing',
  },
  'no-account': {
    title: 'Kurum hesabı bulunamadı',
    description:
      'Kullandığınız kurum adresini kontrol edin. Yeni hesap veya davet için kurumunuzla görüşün.',
    icon: 'building2',
    action: 'help',
  },
  deleted: {
    title: 'Kurum hesabı kapatıldı',
    description:
      'Bu kurum çalışma alanı artık kullanılamıyor. Erişim ve kayıtlarınız hakkında kurumunuzdan bilgi alabilirsiniz.',
    icon: 'building2',
    action: 'help',
  },
  offline: {
    title: 'Bağlantı kurulamadı',
    description:
      'İnternet bağlantınızı kontrol edip tekrar deneyin. Son işlemin tamamlandığını doğrulamadan yeniden göndermeyin.',
    icon: 'globe',
    action: 'retry',
  },
  maintenance: {
    title: 'Kısa bir bakım arası',
    description: 'Çalışma alanı şu anda kullanılamıyor. Bir süre sonra yeniden deneyebilirsiniz.',
    icon: 'settings',
    action: 'retry',
  },
  error: {
    title: 'Bir sorun oluştu',
    description:
      'İşlem tamamlanamadı. Yeniden deneyebilir veya bulunduğunuz sayfayla birlikte destek talebi hazırlayabilirsiniz.',
    icon: 'circle-alert',
    action: 'retry',
  },
  'not-found': {
    title: 'İçerik kullanılamıyor',
    description:
      'Bağlantı değişmiş veya içerik artık erişilebilir olmayabilir. Çalışma alanınızdan yeniden arayın.',
    icon: 'search',
    action: 'home',
  },
  'reset-expired': {
    title: 'Yenileme bağlantısı geçersiz',
    description:
      'Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir. Yeni bir şifre yenileme bağlantısı isteyin.',
    icon: 'lock-keyhole',
    action: 'reset',
  },
} as const;
export type AccessState = keyof typeof accessStates;
export function resolveAccessState(value: string): AccessState {
  return Object.hasOwn(accessStates, value) ? (value as AccessState) : 'not-found';
}
