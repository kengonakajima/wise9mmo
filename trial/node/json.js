var sys = require( 'sys' );

var t = "{ \"aho\":1,\"hoge\":[1,2,3],\"fuga\":\"aaaaaaaakjsdflakjsdflkajshdlkfjahsdlkfjhalksdjfhlakjsdhflkajshdlfkjahsdlfkjahsdlkfjhalksdjfhaaa\\naaaaaaksjdhflkajsdhlfkajhsdlkfjhaslkdjfhalksjdhflakjsdhflkjashdlkfjahsdkfjadsfkjasldkjfhalksdjfhlakjsdhflkajsdhlfkjashldkfjahlsdkjfhalksdjfhalksjdfhlkajsdhflkajsdhfaaa\"}\n{ \"aho\":2,\"hoge\":[3,3,4,5],\"fuga\":\"aaaaaaaaa\\naaaaaaksjdhflkajsdhlfkajhsdlkfjhaslkdjfhalksjdhflakjsdhflkjashdlkfjahsdkfjadsfkjasldkjfhalksdjfhlakjsdhflkajsdhlfkjashldkfjahlsdkjfhalksdjfhalksjdfhlkajsdhflkajsdhfaaa\"}\n{ \"aho\":3,\"hoge\":[4,5,6,7,8,9],\"fuga\":\"aaaaaaaaa\\naaaaaaksjdhflkajsdhlfkajhsdlkfjhaslkdjfhalksjdhflakkfjahsdkfjadsfkjasldkjfhalksdslkajhdflkjahsdlkkajdhflkjasdlfkjahsldkjfalksdjfhlkajsdhflkajhsdlkfjahsdlkfjhasldkjfhalksdjfhlaksdjhflakjsdhflkajsdhflkajshdlfkjahsdlkfjahsdlkfjhalsdkfjhalsdkjfhalskdjfhalksdjfhfjahsldkjfhalksdjfhlaksjdhflakdhfaaa\"}";

var i, totlen=0;

for(i=0;i<100000;i++){ // 10万回で1秒.  同接1000で 5回づつうけたら 5000 で 5% 　まあ、いいだろう
    var ary = t.split("\n");
    var decoded = JSON.parse(ary[1]);

    //sys.puts( "aho:" + decoded.aho );
    //sys.puts( "hoge:" + decoded.hoge );
    //sys.puts( "fuga:" + decoded.fuga );

    decoded.aho += 1;

    var s = JSON.stringify(decoded);

    totlen += s.length;
}

sys.puts( "totlen:" + totlen );
