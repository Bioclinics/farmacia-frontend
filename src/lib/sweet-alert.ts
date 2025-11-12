import Swal from 'sweetalert2'

/**
 * Mostrar confirmación antes de eliminar
 */
export const confirmDelete = (title: string = '¿Eliminar?') => {
  return Swal.fire({
    title,
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    backdrop: true,
  })
}

/**
 * Mostrar error
 */
export const showError = (title: string, message?: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#2e4999',
    backdrop: true,
    showClass: {
      popup: 'animate__animated animate__shakeX'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  })
}

/**
 * Mostrar éxito
 */
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#2e4999',
    backdrop: true,
    timer: 1400,
    showConfirmButton: false,
    position: 'center',
    showClass: {
      popup: 'animate__animated animate__zoomIn'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  })
}

/**
 * Mostrar información
 */
export const showInfo = (title: string, message?: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonColor: '#2e4999',
    backdrop: true,
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  })
}

/**
 * Mostrar cargando
 */
export const showLoading = (title: string = 'Cargando...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    backdrop: true,
    didOpen: () => {
      Swal.showLoading()
    },
    showClass: {
      popup: 'animate__animated animate__fadeIn'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  })
}

/**
 * Cerrar el modal de carga
 */
export const closeLoading = () => {
  Swal.close()
}

/**
 * Toast notification (esquina)
 */
export const showToast = (icon: 'success' | 'error' | 'warning' | 'info' = 'success', title: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    showClass: {
      popup: 'animate__animated animate__fadeInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutRight'
    }
  })

  Toast.fire({
    icon,
    title,
  })
}
