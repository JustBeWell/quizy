import clsx from 'clsx'
import { motion } from 'framer-motion'

export default function Button({children, variant='primary', className='', ...rest}){
  const base = 'px-4 py-2 rounded-md font-medium focus:outline-none'
  const styles = {
    primary: 'bg-brand-700 dark:bg-brand-500 text-white hover:bg-brand-800 dark:hover:bg-brand-600 font-semibold',
    ghost: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-brand-500 dark:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700'
  }
  return (
    <motion.button whileTap={{scale:0.98}} className={clsx(base, styles[variant], className)} {...rest}>
      {children}
    </motion.button>
  )
}
