if ! type tap > /dev/null
then
   read -p 'Requires tap. Install it from npm? [y/N]' INSTALL
   if [ "$INSTALL" = "y" ]
   then
      sudo npm install -g tap
      tap $(find . -iname '*.js')
   else
      exit 1
   fi
else
   tap $(find . -iname '*.js')
fi
