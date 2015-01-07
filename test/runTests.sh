export NODE_ENV=testing

runTests() {
   tap $(find functional unit -iname '*.js')
}

if ! type tap > /dev/null
then
   read -p 'Requires tap. Install it from npm? [y/N]' INSTALL
   if [ "$INSTALL" = "y" ]
   then
      sudo npm install -g tap
      runTests
   else
      exit 1
   fi
else

   if [ $# -gt 0 ]
   then
      cd dirname $1
      tap --tap $1
   else
      runTests
   fi
fi
